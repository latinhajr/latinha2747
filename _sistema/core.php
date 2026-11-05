<?php
declare(strict_types=1);

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    ini_set('session.use_strict_mode', '1');
    session_name('eco_' . STORE);

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => rtrim(
            str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])),
            '/'
        ) . '/',
        'secure' => !empty($_SERVER['HTTPS'])
            && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();

    if (
        isset($_SESSION['last_activity'])
        && time() - $_SESSION['last_activity'] > 3600
    ) {
        $_SESSION = [];
        session_regenerate_id(true);
    }

    $_SESSION['last_activity'] = time();

    if (!isset($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

function config(): array {
    return require __DIR__ . '/config.php';
}

function db(): PDO {
    static $pdo;

    if ($pdo) return $pdo;

    $c = config();

    if (!$c['database']) {
        throw new RuntimeException('Instalação pendente.');
    }

    $pdo = new PDO(
        'mysql:host=' . $c['host']
        . ';dbname=' . $c['database']
        . ';charset=utf8mb4',
        $c['username'],
        $c['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    return $pdo;
}

function query(string $sql, array $args = []): PDOStatement {
    $s = db()->prepare($sql);
    $s->execute($args);
    return $s;
}

function user(): ?array {
    start_session();

    if (empty($_SESSION['uid'])) return null;

    $u = query(
        'SELECT id,name,email,role,created
         FROM eco_users WHERE store=? AND id=?',
        [STORE, $_SESSION['uid']]
    )->fetch();

    return $u ?: null;
}

function role_permissions(string $role): array {
    return match ($role) {
        'admin' => [
            'products', 'orders', 'messages',
            'users', 'reviews', 'team'
        ],
        'catalogo' => ['products'],
        'vendas' => ['products', 'orders', 'users'],
        'financeiro' => ['orders'],
        'atendimento' => ['messages', 'users', 'reviews'],
        default => []
    };
}

function need_admin(): array {
    $u = user();

    if (!$u || !role_permissions($u['role'])) {
        fail('Acesso negado.', 403);
    }

    return $u;
}

function admin_permission(
    array $u,
    string $resource,
    string $method
): void {
    if (!in_array($resource, role_permissions($u['role']), true)) {
        fail('Sua função não permite esta operação.', 403);
    }

    if ($method === 'GET' || $u['role'] === 'admin') return;

    if (
        ($resource === 'products' && $u['role'] === 'catalogo')
        || (
            $resource === 'orders'
            && in_array($u['role'], ['vendas', 'financeiro'], true)
        )
        || (
            in_array($resource, ['messages', 'reviews'], true)
            && $u['role'] === 'atendimento'
        )
    ) {
        return;
    }

    fail('Sua função permite apenas consultar estes registros.', 403);
}

function admin_page(): void {
    start_session();

    try {
        $u = user();
    } catch (Throwable $e) {
        $u = null;
    }

    if (!$u || !role_permissions($u['role'])) {
        header('Location: login.html');
        exit;
    }

    header('Cache-Control: no-store');
}

function answer($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

function fail(string $msg, int $status = 400): void {
    answer(['error' => $msg], $status);
}

function csrf(): void {
    start_session();

    if (
        !hash_equals(
            $_SESSION['csrf'],
            $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''
        )
    ) {
        fail('Sessão expirada. Atualize a página e tente novamente.', 403);
    }
}

function products(): array {
    return array_map(
        fn($r) => json_decode($r['data'], true),
        query(
            'SELECT data FROM eco_products
             WHERE store=? ORDER BY sort_order,id',
            [STORE]
        )->fetchAll()
    );
}

function text($v, int $max = 500): string {
    if (!is_scalar($v)) fail('Campo inválido.');
    return substr(trim((string)$v), 0, $max);
}

function safe_image($v): string {
    $s = text($v, 400);

    if (
        !preg_match(
            '~^(?:https://[a-z0-9.-]+(?::[0-9]+)?/|(?:\.\./)?(?:images|img)/)[a-zA-Z0-9_./%?=&+-]+$~',
            $s
        )
    ) {
        fail(
            'Imagem inválida. Use images/foto.jpg (27), '
            . '../img/foto.jpg (47) ou uma URL HTTPS.'
        );
    }

    return $s;
}

function clean_product(array $p): array {
    if (STORE === '27') {
        $id = filter_var(
            $p['id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 999999]]
        );

        $price = filter_var(
            $p['preco'] ?? null,
            FILTER_VALIDATE_FLOAT
        );

        if (
            !$id || $price === false || $price < 0
            || $price > 1000000 || !text($p['nome'] ?? '', 120)
        ) {
            fail('Informe ID, nome e preço válidos.');
        }

        if (empty($p['cores']) || !is_array($p['cores'])) {
            fail('Informe pelo menos uma cor.');
        }

        $stock = [];

        foreach (['P', 'M', 'G', 'GG'] as $size) {
            $n = filter_var(
                $p['estoque'][$size] ?? 0,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 0, 'max_range' => 100000]]
            );

            if ($n === false) fail('Estoque inválido.');
            $stock[$size] = $n;
        }

        return [
            'id' => $id,
            'nome' => text($p['nome'], 120),
            'cat' => text($p['cat'] ?? 'cargo', 40),
            'preco' => (float)$price,
            'de' => max(0, min(1000000, (float)($p['de'] ?? 0))),
            'img' => safe_image($p['img'] ?? ''),
            'cores' => array_slice(
                array_map(
                    fn($s) => text($s, 40),
                    (array)($p['cores'] ?? [])
                ),
                0,
                10
            ),
            'tags' => array_slice(
                array_map(
                    fn($s) => text($s, 40),
                    (array)($p['tags'] ?? [])
                ),
                0,
                10
            ),
            'estoque' => $stock,
            'nota' => 0,
            'avaliacoes' => 0,
            'desc' => text($p['desc'] ?? '', 4000)
        ];
    }

    $id = text($p['id'] ?? '', 60);
    $price = filter_var($p['price'] ?? null, FILTER_VALIDATE_FLOAT);

    if (
        !preg_match('/^[a-z0-9-]{1,60}$/', $id)
        || $price === false || $price < 0 || $price > 1000000
        || !text($p['name'] ?? '', 120)
    ) {
        fail('Informe ID, nome e preço válidos.');
    }

    if (
        empty($p['sizes']) || !is_array($p['sizes'])
        || empty($p['images']) || !is_array($p['images'])
    ) {
        fail('Informe ao menos um tamanho e uma imagem.');
    }

    return [
        'id' => $id,
        'name' => text($p['name'], 120),
        'price' => (float)$price,
        'category' => text($p['category'] ?? '', 40),
        'tag' => text($p['tag'] ?? '', 40),
        'sizes' => array_slice(
            array_map(
                fn($s) => text($s, 20),
                (array)($p['sizes'] ?? [])
            ),
            0,
            12
        ),
        'images' => array_slice(
            array_map('safe_image', (array)($p['images'] ?? [])),
            0,
            8
        ),
        'short' => text($p['short'] ?? '', 500),
        'description' => text($p['description'] ?? '', 4000)
    ];
}

function save_product(array $p): void {
    query(
        'INSERT INTO eco_products(store,id,data) VALUES(?,?,?)
         ON DUPLICATE KEY UPDATE data=VALUES(data)',
        [
            STORE,
            (string)$p['id'],
            json_encode($p, JSON_UNESCAPED_UNICODE)
        ]
    );
}
