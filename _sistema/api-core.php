<?php
require __DIR__.'/core.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

start_session();

$path = '/'.trim((string)($_GET['route'] ?? ''), '/');
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET' && $path === '/me') {
        answer(['user' => user(), 'csrf' => $_SESSION['csrf']]);
    }

    if ($method === 'GET' && $path === '/products') {
        answer(products());
    }

    if ($method !== 'GET') csrf();

    $raw = file_get_contents('php://input');

    if (strlen($raw) > 100000) {
        fail('Requisição muito grande.', 413);
    }

    $d = $raw ? json_decode($raw, true) : [];

    if (!is_array($d)) fail('JSON inválido.');

    if (
        $method === 'POST'
        && ($path === '/login' || $path === '/register')
    ) {
        $email = strtolower(text($d['email'] ?? '', 190));
        $pw = (string)($d['password'] ?? '');

        if (
            !filter_var($email, FILTER_VALIDATE_EMAIL)
            || strlen($pw) < 8 || strlen($pw) > 72
        ) {
            fail('Informe e-mail e senha de 8 a 72 caracteres.');
        }

        $rate = hash(
            'sha256',
            STORE.'|'.($_SERVER['REMOTE_ADDR'] ?? 'unknown')
        );

        query(
            'INSERT INTO eco_auth_limits(bucket,attempts,expires)
             VALUES(?,1,?)
             ON DUPLICATE KEY UPDATE
             attempts=IF(expires<?,1,attempts+1),
             expires=IF(expires<?,VALUES(expires),expires)',
            [$rate, time()+900, time(), time()]
        );

        $limit = query(
            'SELECT attempts FROM eco_auth_limits WHERE bucket=?',
            [$rate]
        )->fetchColumn();

        if ($limit > 30) {
            fail('Muitas tentativas. Aguarde 15 minutos.', 429);
        }

        if ($path === '/register') {
            $name = text($d['name'] ?? '', 120);

            if (!$name) fail('Informe seu nome.');

            try {
                query(
                    'INSERT INTO eco_users(store,name,email,pw,created)
                     VALUES(?,?,?,?,?)',
                    [
                        STORE, $name, $email,
                        password_hash($pw, PASSWORD_DEFAULT), time()
                    ]
                );
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    fail('Este e-mail já está cadastrado.', 409);
                }

                throw $e;
            }
        }

        $u = query(
            'SELECT * FROM eco_users WHERE store=? AND email=?',
            [STORE, $email]
        )->fetch();

        if (!$u || !password_verify($pw, $u['pw'])) {
            usleep(350000);
            fail('E-mail ou senha incorretos.', 401);
        }

        session_regenerate_id(true);
        $_SESSION['uid'] = $u['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));

        answer(['ok' => true, 'role' => $u['role']]);
    }

    if ($method === 'POST' && $path === '/logout') {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        answer(['ok' => true]);
    }

    if ($method === 'GET' && $path === '/orders') {
        $u = user();

        if (!$u) fail('Entre na sua conta.', 401);

        $rows = query(
            'SELECT id,total,status,created,data FROM eco_orders
             WHERE store=? AND user_id=? ORDER BY created DESC',
            [STORE, $u['id']]
        )->fetchAll();

        foreach ($rows as &$row) {
            $public = json_decode($row['data'], true);

            foreach ([
                'internal_note',
                'note_updated_by',
                'note_updated_at',
                'history',
                'payment_confirmed_by'
            ] as $private) {
                unset($public[$private]);
            }

            $row['data'] = json_encode(
                $public,
                JSON_UNESCAPED_UNICODE
            );
        }

        unset($row);
        answer($rows);
    }

    if ($method === 'POST' && $path === '/orders') {
        $u = user();

        if (!$u) {
            fail('Entre na sua conta antes de enviar o pedido.', 401);
        }

        $items = $d['items'] ?? [];

        if (!is_array($items) || !count($items) || count($items) > 50) {
            fail('Sacola vazia ou inválida.');
        }

        db()->beginTransaction();

        $lines = [];
        $subtotal = 0;
        $updates = [];

        foreach ($items as $item) {
            $id = text($item['id'] ?? '', 60);

            $row = query(
                'SELECT data FROM eco_products
                 WHERE store=? AND id=? FOR UPDATE',
                [STORE, $id]
            )->fetch();

            if (!$row) {
                fail('Produto indisponível. Atualize a sacola.');
            }

            $p = $updates[$id] ?? json_decode($row['data'], true);

            $qty = filter_var(
                $item['qty'] ?? $item['qtd'] ?? 0,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1, 'max_range' => 99]]
            );

            if (!$qty) fail('Quantidade inválida.');

            $size = html_entity_decode(
                text($item['size'] ?? $item['tam'] ?? '', 80),
                ENT_QUOTES,
                'UTF-8'
            );

            if (STORE === '27') {
                if (
                    !isset($p['estoque'][$size])
                    || $p['estoque'][$size] < $qty
                ) {
                    fail('Estoque insuficiente para '.$p['nome'].'.');
                }

                $color = html_entity_decode(
                    text($item['cor'] ?? '', 160),
                    ENT_QUOTES,
                    'UTF-8'
                );

                if (!in_array($color, $p['cores'], true)) {
                    fail('Cor inválida.');
                }

                $p['estoque'][$size] -= $qty;
                $updates[$id] = $p;
                $price = $p['preco'];
                $name = $p['nome'];
            } else {
                if (!in_array($size, $p['sizes'], true)) {
                    fail('Tamanho inválido.');
                }

                $price = $p['price'];
                $name = $p['name'];
                $color = '';
            }

            $subtotal += $price * $qty;

            $lines[] = [
                'id' => $id,
                'name' => $name,
                'size' => $size,
                'color' => $color,
                'qty' => $qty,
                'price' => $price,
                'description' => $p['desc']
                    ?? $p['description']
                    ?? $p['short']
                    ?? ''
            ];
        }

        $contact = $d['contact'] ?? [];
        $name = text($contact['name'] ?? $u['name'], 120);
        $phone = text($contact['phone'] ?? '', 60);
        $address = text($contact['address'] ?? '', 1000);

        if (!$name || !$phone) {
            fail('Informe nome e telefone.');
        }

        $discount = STORE === '27'
            && ($d['coupon'] ?? '') === 'VINTTE10'
            ? round($subtotal * .1, 2)
            : 0;

        $shipping = STORE === '27' && $subtotal < 249 ? 24.90 : 0;
        $total = round($subtotal + $shipping - $discount, 2);

        $id = STORE.'-'.strtoupper(bin2hex(random_bytes(6)));
        $status = 'Aguardando confirmação da loja';

        foreach ($updates as $p) save_product($p);

        query(
            'INSERT INTO eco_orders
             (id,store,user_id,data,total,status,created)
             VALUES(?,?,?,?,?,?,?)',
            [
                $id,
                STORE,
                $u['id'],
                json_encode([
                    'items' => $lines,
                    'contact' => [
                        'name' => $name,
                        'phone' => $phone,
                        'address' => $address
                    ],
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'shipping' => $shipping
                ], JSON_UNESCAPED_UNICODE),
                $total,
                $status,
                time()
            ]
        );

        db()->commit();

        answer([
            'ok' => true,
            'id' => $id,
            'total' => $total,
            'status' => $status
        ]);
    }

    if ($method === 'POST' && $path === '/contact') {
        if (
            !empty($_SESSION['last_contact'])
            && time() - $_SESSION['last_contact'] < 30
        ) {
            fail(
                'Aguarde alguns segundos antes de enviar outra mensagem.',
                429
            );
        }

        $name = text($d['name'] ?? '', 120);
        $email = text($d['email'] ?? '', 190);
        $phone = text($d['phone'] ?? '', 60);
        $msg = text($d['message'] ?? '', 4000);

        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$msg) {
            fail('Preencha nome, e-mail e mensagem.');
        }

        query(
            'INSERT INTO eco_messages
             (store,name,email,phone,message,created)
             VALUES(?,?,?,?,?,?)',
            [STORE, $name, $email, $phone, $msg, time()]
        );

        $_SESSION['last_contact'] = time();
        answer(['ok' => true]);
    }

    if (
        preg_match('~^/reviews/([0-9]+)$~', $path, $m)
        && STORE === '27'
    ) {
        if ($method === 'GET') {
            answer(query(
                'SELECT r.rating AS nota,r.review AS texto,
                 r.created,u.name AS nome
                 FROM eco_reviews r
                 JOIN eco_users u ON r.user_id=u.id
                 WHERE r.store=? AND r.product_id=?
                 ORDER BY r.created DESC',
                [STORE, $m[1]]
            )->fetchAll());
        }

        if ($method === 'POST') {
            $u = user();

            if (!$u) fail('Entre na sua conta para avaliar.', 401);

            $rating = filter_var(
                $d['rating'] ?? 0,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1, 'max_range' => 5]]
            );

            $review = text($d['text'] ?? '', 2000);

            if (!$rating || !$review) {
                fail('Informe nota e avaliação.');
            }

            if (!query(
                'SELECT id FROM eco_products WHERE store=? AND id=?',
                [STORE, $m[1]]
            )->fetch()) {
                fail('Produto indisponível.', 404);
            }

            query(
                'INSERT INTO eco_reviews
                 (store,product_id,user_id,rating,review,created)
                 VALUES(?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE
                 rating=VALUES(rating),
                 review=VALUES(review),
                 created=VALUES(created)',
                [STORE, $m[1], $u['id'], $rating, $review, time()]
            );

            answer(['ok' => true]);
        }
    }

    if (str_starts_with($path, '/admin/')) {
        $me = need_admin();

        if ($method === 'GET' && $path === '/admin/permissions') {
            answer([
                'role' => $me['role'],
                'resources' => role_permissions($me['role'])
            ]);
        }

        $resource = explode('/', trim($path, '/'))[1] ?? '';

        if (in_array($resource, ['order-status', 'order-notes'], true)) {
            $resource = 'orders';
        }

        admin_permission($me, $resource, $method);

        if ($method === 'POST' && $path === '/admin/team') {
            $id = filter_var($d['id'] ?? 0, FILTER_VALIDATE_INT);
            $role = text($d['role'] ?? '', 16);

            if (!in_array($role, [
                'cliente', 'catalogo', 'vendas',
                'financeiro', 'atendimento'
            ], true)) {
                fail('Função inválida.');
            }

            if ($id) {
                $target = query(
                    'SELECT id,role FROM eco_users WHERE store=? AND id=?',
                    [STORE, $id]
                )->fetch();

                if (!$target) fail('Conta não encontrada.', 404);

                if ($target['role'] === 'admin' || $id === $me['id']) {
                    fail(
                        'A conta do administrador principal '
                        .'não pode ser alterada aqui.'
                    );
                }

                query(
                    'UPDATE eco_users SET role=? WHERE store=? AND id=?',
                    [$role, STORE, $id]
                );
            } else {
                $name = text($d['name'] ?? '', 120);
                $email = strtolower(text($d['email'] ?? '', 190));
                $pw = (string)($d['password'] ?? '');

                if (
                    !$name || !filter_var($email, FILTER_VALIDATE_EMAIL)
                    || strlen($pw) < 12 || strlen($pw) > 72
                    || $role === 'cliente'
                ) {
                    fail(
                        'Preencha nome, e-mail, função '
                        .'e senha de 12 a 72 caracteres.'
                    );
                }

                try {
                    query(
                        'INSERT INTO eco_users
                         (store,name,email,pw,role,created)
                         VALUES(?,?,?,?,?,?)',
                        [
                            STORE, $name, $email,
                            password_hash($pw, PASSWORD_DEFAULT),
                            $role, time()
                        ]
                    );
                } catch (PDOException $e) {
                    if ($e->getCode() === '23000') {
                        fail('Este e-mail já está cadastrado.', 409);
                    }

                    throw $e;
                }
            }

            answer(['ok' => true]);
        }

        if ($method === 'POST' && $path === '/admin/order-notes') {
            if (!in_array($me['role'], ['admin', 'vendas'], true)) {
                fail(
                    'Observações são gerenciadas por vendas ou administrador.',
                    403
                );
            }

            $id = text($d['id'] ?? '', 40);
            $note = text($d['note'] ?? '', 4000);

            db()->beginTransaction();

            $row = query(
                'SELECT data FROM eco_orders
                 WHERE store=? AND id=? FOR UPDATE',
                [STORE, $id]
            )->fetch();

            if (!$row) fail('Pedido não encontrado.', 404);

            $data = json_decode($row['data'], true);
            $data['internal_note'] = $note;
            $data['note_updated_by'] = $me['name'];
            $data['note_updated_at'] = time();

            query(
                'UPDATE eco_orders SET data=? WHERE store=? AND id=?',
                [
                    json_encode($data, JSON_UNESCAPED_UNICODE),
                    STORE,
                    $id
                ]
            );

            db()->commit();
            answer(['ok' => true]);
        }

        if ($method === 'GET' && $path === '/admin/products') {
            answer(products());
        }

        if ($method === 'POST' && $path === '/admin/products') {
            save_product(clean_product($d));
            answer(['ok' => true]);
        }

        if ($method === 'GET' && $path === '/admin/users') {
            answer(query(
                'SELECT id,name,email,role,created
                 FROM eco_users WHERE store=? ORDER BY id',
                [STORE]
            )->fetchAll());
        }

        if ($method === 'GET' && $path === '/admin/orders') {
            answer(query(
                'SELECT o.*,u.name AS customer FROM eco_orders o
                 LEFT JOIN eco_users u ON o.user_id=u.id
                 WHERE o.store=? ORDER BY o.created DESC',
                [STORE]
            )->fetchAll());
        }

        if ($method === 'GET' && $path === '/admin/reviews') {
            answer(query(
                'SELECT r.*,u.name FROM eco_reviews r
                 JOIN eco_users u ON r.user_id=u.id
                 WHERE r.store=? ORDER BY r.created DESC',
                [STORE]
            )->fetchAll());
        }

        if ($method === 'GET' && $path === '/admin/messages') {
            answer(query(
                'SELECT * FROM eco_messages
                 WHERE store=? ORDER BY created DESC',
                [STORE]
            )->fetchAll());
        }

        if ($method === 'POST' && $path === '/admin/order-status') {
            $status = text($d['status'] ?? '', 80);

            if (!in_array($status, [
                'Aguardando confirmação da loja',
                'Aguardando pagamento',
                'Pagamento confirmado manualmente',
                'Em preparação',
                'Enviado',
                'Entregue',
                'Cancelado'
            ], true)) {
                fail('Status inválido.');
            }

            $financial = [
                'Aguardando pagamento',
                'Pagamento confirmado manualmente'
            ];

            if (
                $me['role'] === 'financeiro'
                && !in_array($status, $financial, true)
            ) {
                fail('O financeiro altera apenas o status de pagamento.', 403);
            }

            if (
                $me['role'] === 'vendas'
                && in_array($status, $financial, true)
            ) {
                fail(
                    'A confirmação de pagamento pertence '
                    .'ao financeiro ou administrador.',
                    403
                );
            }

            $id = text($d['id'] ?? '', 40);

            db()->beginTransaction();

            $order = query(
                'SELECT * FROM eco_orders
                 WHERE store=? AND id=? FOR UPDATE',
                [STORE, $id]
            )->fetch();

            if (!$order) fail('Pedido não encontrado.', 404);

            if ($order['status'] === 'Cancelado' && $status !== 'Cancelado') {
                fail('Um pedido cancelado não pode ser reaberto.');
            }

            if (
                STORE === '27'
                && $status === 'Cancelado'
                && $order['status'] !== 'Cancelado'
            ) {
                foreach (json_decode($order['data'], true)['items'] as $i) {
                    $r = query(
                        'SELECT data FROM eco_products
                         WHERE store=? AND id=? FOR UPDATE',
                        [STORE, $i['id']]
                    )->fetch();

                    if ($r) {
                        $p = json_decode($r['data'], true);
                        $p['estoque'][$i['size']] += $i['qty'];
                        save_product($p);
                    }
                }
            }

            $orderData = json_decode($order['data'], true);

            if ($order['status'] !== $status) {
                $orderData['history'][] = [
                    'from' => $order['status'],
                    'to' => $status,
                    'at' => time(),
                    'by' => $me['name'],
                    'role' => $me['role']
                ];

                $orderData['history'] = array_slice(
                    $orderData['history'],
                    -100
                );
            }

            if ($status === 'Pagamento confirmado manualmente') {
                $orderData['payment_confirmed'] = true;
                $orderData['payment_confirmed_at'] = time();
                $orderData['payment_confirmed_by'] = $me['id'];
            }

            if ($status === 'Aguardando pagamento') {
                $orderData['payment_confirmed'] = false;

                unset(
                    $orderData['payment_confirmed_at'],
                    $orderData['payment_confirmed_by']
                );
            }

            query(
                'UPDATE eco_orders SET status=?,data=?
                 WHERE store=? AND id=?',
                [
                    $status,
                    json_encode($orderData, JSON_UNESCAPED_UNICODE),
                    STORE,
                    $id
                ]
            );

            db()->commit();
            answer(['ok' => true]);
        }

        if (
            $method === 'DELETE'
            && preg_match(
                '~^/admin/(products|users|messages|reviews)/([a-zA-Z0-9-]+)$~',
                $path,
                $m
            )
        ) {
            if ($m[1] === 'users') {
                if ((string)$me['id'] === $m[2]) {
                    fail('Você não pode excluir a própria conta.');
                }

                query(
                    "DELETE FROM eco_users
                     WHERE store=? AND id=? AND role='cliente'",
                    [STORE, $m[2]]
                );
            } elseif ($m[1] === 'products') {
                query(
                    'DELETE FROM eco_products WHERE store=? AND id=?',
                    [STORE, $m[2]]
                );
            } elseif ($m[1] === 'reviews') {
                query(
                    'DELETE FROM eco_reviews WHERE store=? AND id=?',
                    [STORE, $m[2]]
                );
            } else {
                query(
                    'DELETE FROM eco_messages WHERE store=? AND id=?',
                    [STORE, $m[2]]
                );
            }

            answer(['ok' => true]);
        }
    }

    fail('Rota não encontrada.', 404);
} catch (Throwable $e) {
    error_log('EcoFashion: '.$e->getMessage());

    fail(
        'Não foi possível concluir. '
        .'Verifique a instalação e a conexão com o banco.',
        503
    );
}