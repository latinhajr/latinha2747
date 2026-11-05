<?php
$asset = STORE === '27' ? '../../_sistema/' : '../_sistema/';
$home = STORE === '27' ? 'index.html' : '_src-site/home.html';
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Painel <?= STORE ?> • Eco Fashion</title>
    <link rel="stylesheet"
          href="<?= $asset ?>dashboard.css?v=20261008">
</head>
<body>
<div class="shell">
    <aside class="sidebar">
        <a class="wordmark" href="<?= $home ?>">
            <?= STORE === '27' ? 'VINTTESETE' : 'QUARENTA&SETE' ?>
            <span>Administração</span>
        </a>

        <nav>
            <button data-tab="overview" class="active">Visão geral</button>
            <button data-tab="reports">Relatórios</button>
            <button data-tab="team">Equipe e funções</button>
            <button data-tab="products">Produtos</button>
            <button data-tab="orders">Pedidos</button>
            <button data-tab="messages">Mensagens</button>
            <button data-tab="users">Clientes</button>

            <?php if (STORE === '27'): ?>
                <button data-tab="reviews">Avaliações</button>
            <?php endif; ?>
        </nav>

        <a href="<?= $home ?>">↗ Ver loja</a>
        <button id="logout" class="secondary">Sair da conta</button>
    </aside>

    <main class="content">
        <div class="top">
            <div>
                <p class="eyebrow">Seu negócio, organizado</p>
                <h1>Painel da loja <?= STORE ?></h1>
            </div>
            <span id="admin-name" class="muted"></span>
        </div>

        <p id="notice" class="notice" hidden role="status"></p>

        <div class="stats">
            <div class="stat">
                <span>Produtos</span>
                <strong id="n-products">—</strong>
            </div>
            <div class="stat">
                <span>Pedidos registrados</span>
                <strong id="n-orders">—</strong>
            </div>
            <div class="stat">
                <span>Mensagens recebidas</span>
                <strong id="n-messages">—</strong>
            </div>
        </div>

        <section id="overview" class="panel">
            <div class="box">
                <div class="top">
                    <h2>Resumo do período</h2>
                    <div class="actions">
                        <label>
                            De
                            <input id="date-from" type="date">
                        </label>
                        <label>
                            Até
                            <input id="date-to" type="date">
                        </label>
                        <button id="apply-period">Aplicar</button>
                        <button id="refresh-data" class="secondary">
                            Atualizar
                        </button>
                    </div>
                </div>

                <p class="muted" id="period-note"></p>
                <div class="stats" id="business-stats"></div>
            </div>

            <div class="chart-grid">
                <div class="box">
                    <h2>Pedidos por mês</h2>
                    <div id="month-chart"></div>
                </div>
                <div class="box">
                    <h2>Distribuição por status</h2>
                    <div id="status-chart"></div>
                </div>
            </div>

            <div class="box">
                <h2>Produtos mais pedidos</h2>
                <div id="top-chart"></div>
            </div>
        </section>

        <section id="reports" class="panel" hidden>
            <div class="box">
                <div class="top">
                    <h2>Relatórios do período</h2>
                    <button id="print-report">Imprimir / salvar PDF</button>
                </div>

                <p class="muted">
                    Use as datas da visão geral. CSV abre no Excel;
                    PDF pode ser salvo pela impressão do navegador.
                </p>

                <div id="report-summary"></div>

                <div class="actions">
                    <button id="export-orders">Baixar pedidos CSV</button>
                    <button id="export-products">Baixar produtos CSV</button>
                </div>

                <div id="report-table" class="table-wrap"></div>
            </div>
        </section>

        <section id="team" class="panel" hidden>
            <div class="box">
                <h2>Equipe e segregação de funções</h2>

                <p class="muted">
                    Administrador: acesso completo.
                    Catálogo: edita produtos.
                    Vendas: acompanha e prepara pedidos.
                    Financeiro: confirma pagamentos manualmente.
                    Atendimento: consulta clientes e gerencia mensagens
                    e avaliações. Cada conta atua somente nesta loja.
                </p>

                <div class="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Função</th>
                            <th>Ação</th>
                        </tr>
                        </thead>
                        <tbody id="team-list"></tbody>
                    </table>
                </div>
            </div>

            <form id="team-form" class="box">
                <h2>Adicionar integrante</h2>

                <div class="fields">
                    <label>
                        Nome
                        <input name="name" required maxlength="120">
                    </label>
                    <label>
                        E-mail
                        <input name="email" type="email"
                               required maxlength="190">
                    </label>
                    <label>
                        Senha inicial
                        <input name="password" type="password"
                               minlength="12" maxlength="72"
                               required autocomplete="new-password">
                    </label>
                    <label>
                        Função
                        <select name="role">
                            <option value="catalogo">Catálogo</option>
                            <option value="vendas">Vendas</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="atendimento">Atendimento</option>
                        </select>
                    </label>
                </div>

                <button type="submit">Criar conta da equipe</button>
            </form>
        </section>

        <section id="products" class="panel" hidden>
            <div class="box">
                <div class="top">
                    <h2>Seu catálogo</h2>
                    <button id="new-product">+ Novo produto</button>
                </div>

                <label>
                    Buscar produto
                    <input id="product-search" type="search"
                           placeholder="Nome, ID ou categoria">
                </label>

                <div class="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Preço</th>
                            <th>Categoria</th>
                            <th>Ações</th>
                        </tr>
                        </thead>
                        <tbody id="product-list"></tbody>
                    </table>
                </div>
            </div>

            <form id="product-form" class="box" hidden>
                <h2 id="form-title">Novo produto</h2>
                <div id="product-fields" class="fields"></div>

                <p class="muted small">
                    Envie fotos pelo gerenciador de arquivos para a pasta
                    images (27) ou img (47).
                    Depois informe o caminho abaixo.
                </p>

                <div class="actions">
                    <button type="submit">Salvar produto</button>
                    <button type="button" class="secondary" id="cancel-edit">
                        Cancelar
                    </button>
                </div>
            </form>
        </section>

        <section id="orders" class="panel" hidden>
            <div class="box">
                <h2>Pedidos</h2>

                <label>
                    Buscar por pedido, cliente ou produto
                    <input id="order-search" type="search"
                           placeholder="Digite para filtrar">
                </label>

                <p class="muted">
                    O pagamento é confirmado manualmente após combinar
                    com o cliente. Alterar o status aqui não realiza cobrança.
                </p>

                <div class="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Pedido / cliente</th>
                            <th>Itens e entrega</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody id="order-list"></tbody>
                    </table>
                </div>
            </div>
        </section>

        <section id="messages" class="panel" hidden>
            <div class="box">
                <h2>Mensagens de contato</h2>
                <div id="message-list"></div>
            </div>
        </section>

        <section id="users" class="panel" hidden>
            <div class="box">
                <h2>Clientes cadastrados</h2>

                <div class="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Perfil</th>
                            <th>Cadastro</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody id="user-list"></tbody>
                    </table>
                </div>
            </div>
        </section>

        <section id="reviews" class="panel" hidden>
            <div class="box">
                <h2>Avaliações de clientes</h2>
                <div id="review-list"></div>
            </div>
        </section>
    </main>
</div>

<dialog id="detail-dialog">
    <button id="close-detail" class="secondary">Fechar</button>
    <div id="detail-body"></div>
</dialog>

<script>
    window.ECO_STORE_BASE = new URL('./', location.href).href;
    window.ECO_STORE = '<?= STORE ?>';
</script>
<script src="<?= $asset ?>client.js"></script>
<script src="<?= $asset ?>dashboard.js?v=20261008"></script>
</body>
</html>