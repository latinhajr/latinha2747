(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = EcoAPI.escape;
  const api = EcoAPI.call;
  const store = window.ECO_STORE;

  const money = n => Number(n).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const date = n => new Date(n * 1000).toLocaleString('pt-BR');
  const pname = p => p.nome || p.name;
  const pprice = p => p.preco ?? p.price;
  const pcat = p => p.cat || p.category;

  let catalog = [];
  let orders = [];
  let messages = [];
  let users = [];
  let resources = [];
  let role = '';

  const statuses = [
    'Aguardando confirmação da loja',
    'Aguardando pagamento',
    'Pagamento confirmado manualmente',
    'Em preparação',
    'Enviado',
    'Entregue',
    'Cancelado'
  ];

  const roles = {
    cliente: 'Cliente',
    admin: 'Administrador',
    catalogo: 'Catálogo',
    vendas: 'Vendas',
    financeiro: 'Financeiro',
    atendimento: 'Atendimento'
  };

  function notice(message) {
    $('notice').textContent = message;
    $('notice').hidden = !message;
  }

  function run(fn) {
    return Promise.resolve()
      .then(fn)
      .catch(error => notice(error.message));
  }

  async function load() {
    const values = await Promise.all(
      ['products', 'orders', 'messages', 'users'].map(resource =>
        resources.includes(resource)
          ? api('admin/' + resource)
          : Promise.resolve([])
      )
    );

    [catalog, orders, messages, users] = values;

    $('n-products').textContent =
      resources.includes('products') ? catalog.length : '—';

    $('n-orders').textContent =
      resources.includes('orders') ? orders.length : '—';

    $('n-messages').textContent =
      resources.includes('messages') ? messages.length : '—';

    if (store === '27' && resources.includes('reviews')) {
      const reviews = await api('admin/reviews');

      $('review-list').innerHTML = reviews.map(r => `
        <article class="box">
          <strong>
            ${esc(r.name)} • Produto ${esc(r.product_id)}
            • ${r.rating}/5
          </strong>
          <p>${esc(r.review)}</p>
          <button class="danger" data-delreview="${r.id}">
            Excluir avaliação
          </button>
        </article>
      `).join('') || '<p class="empty">Nenhuma avaliação ainda.</p>';
    }

    renderProducts();
    renderOrders();
    renderBusiness();
    renderTeam();

    $('message-list').innerHTML = messages.map(m => `
      <article class="box">
        <strong>${esc(m.name)}</strong>
        <p class="muted small">
          ${esc(m.email)} • ${esc(m.phone)} • ${date(m.created)}
        </p>
        <p class="description">${esc(m.message)}</p>
        <button class="danger" data-delmessage="${m.id}">
          Excluir mensagem
        </button>
      </article>
    `).join('') || '<p class="empty">Nenhuma mensagem recebida.</p>';

    $('user-list').innerHTML = users
      .filter(u => u.role === 'cliente')
      .map(u => `
        <tr>
          <td>${esc(u.name)}</td>
          <td>${esc(u.email)}</td>
          <td>Cliente</td>
          <td>${date(u.created)}</td>
          <td>
            ${role === 'admin' ? `
              <button class="danger" data-deluser="${u.id}">
                Excluir
              </button>
            ` : ''}
          </td>
        </tr>
      `).join('') ||
      '<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>';
  }

  function details(title, body) {
    $('detail-body').innerHTML = `<h2>${esc(title)}</h2>${body}`;
    $('detail-dialog').showModal();
  }

  function renderProducts() {
    const q = $('product-search').value.toLocaleLowerCase('pt-BR');

    $('product-list').innerHTML = catalog
      .map((p, i) => ({ p, i }))
      .filter(({ p }) =>
        [pname(p), p.id, pcat(p)]
          .join(' ')
          .toLocaleLowerCase('pt-BR')
          .includes(q)
      )
      .map(({ p, i }) => `
        <tr>
          <td>
            <strong>${esc(pname(p))}</strong><br>
            <span class="muted">#${esc(p.id)}</span>
            <p class="small">
              ${esc(
                (p.desc || p.short || p.description || 'Sem descrição')
                  .slice(0, 110)
              )}
            </p>
          </td>
          <td>${money(pprice(p))}</td>
          <td>${esc(pcat(p))}</td>
          <td>
            <button data-productdetail="${i}" class="secondary">
              Detalhes
            </button>
            ${['admin', 'catalogo'].includes(role) ? `
              <button data-edit="${i}">Editar</button>
              <button class="danger" data-delete="${esc(p.id)}">
                Excluir
              </button>
            ` : ''}
          </td>
        </tr>
      `).join('') ||
      '<tr><td colspan="4">Nenhum produto encontrado.</td></tr>';
  }

  function allowedStatuses(order) {
    if (order.status === 'Cancelado') return ['Cancelado'];

    if (role === 'financeiro') {
      return [
        order.status,
        'Aguardando pagamento',
        'Pagamento confirmado manualmente'
      ].filter((value, index, list) => list.indexOf(value) === index);
    }

    if (role === 'vendas') {
      return statuses.filter(status =>
        ![
          'Aguardando pagamento',
          'Pagamento confirmado manualmente'
        ].includes(status) || status === order.status
      );
    }

    return statuses;
  }

  function renderOrders() {
    const q = $('order-search').value.toLocaleLowerCase('pt-BR');

    $('order-list').innerHTML = orders
      .map((o, i) => ({ o, i, d: JSON.parse(o.data) }))
      .filter(({ o, d }) =>
        [
          o.id,
          o.customer,
          d.contact.name,
          ...d.items.map(item => item.name)
        ].join(' ').toLocaleLowerCase('pt-BR').includes(q)
      )
      .map(({ o, i, d }) => `
        <tr>
          <td>
            <strong>${esc(o.id)}</strong><br>
            ${esc(o.customer || d.contact.name)}<br>
            <span class="muted">${date(o.created)}</span>
          </td>
          <td>
            ${d.items.map(item => `
              ${item.qty}× ${esc(item.name)}
              (${esc(item.size)}${item.color ? ' / ' + esc(item.color) : ''})
            `).join('<br>')}
            <br>
            <button class="secondary" data-orderdetail="${i}">
              Ver pedido completo
            </button>
          </td>
          <td>${money(o.total)}</td>
          <td>
            <select data-status="${esc(o.id)}">
              ${allowedStatuses(o).map(status => `
                <option ${status === o.status ? 'selected' : ''}>
                  ${esc(status)}
                </option>
              `).join('')}
            </select>
          </td>
        </tr>
      `).join('') ||
      '<tr><td colspan="4">Nenhum pedido encontrado.</td></tr>';
  }

  function selectedOrders() {
    const start = $('date-from').value;
    const end = $('date-to').value;

    return orders.filter(order => {
      const dt = new Date(order.created * 1000);
      const day = dt.getFullYear() + '-' +
        String(dt.getMonth() + 1).padStart(2, '0') + '-' +
        String(dt.getDate()).padStart(2, '0');

      return (!start || day >= start) && (!end || day <= end);
    });
  }

  function bars(id, values, format = n => String(n)) {
    const max = Math.max(1, ...values.map(item => item[1]));

    $(id).innerHTML = values.length
      ? values.map(([label, value]) => `
          <div class="chart-row">
            <div class="chart-label">
              <span>${esc(label)}</span>
              <strong>${esc(format(value))}</strong>
            </div>
            <div class="chart-track">
              <div class="chart-fill"
                   style="width:${Math.max(0, value / max * 100)}%">
              </div>
            </div>
          </div>
        `).join('')
      : '<p class="empty">Sem dados no período.</p>';
  }

  function renderBusiness() {
    const list = selectedOrders();
    const active = list.filter(order => order.status !== 'Cancelado');

    const confirmed = active.filter(order =>
      JSON.parse(order.data).payment_confirmed === true ||
      order.status === 'Pagamento confirmado manualmente'
    );

    const sum = items =>
      items.reduce((total, order) => total + Number(order.total), 0);

    const total = sum(active);

    $('period-note').textContent = resources.includes('orders')
      ? 'Valores de pedidos registrados; não representam cobrança automática. ' +
        'Pagamento confirmado indica confirmação manual da equipe.'
      : 'Sua função exibe somente os módulos autorizados.';

    const metrics = resources.includes('orders')
      ? [
          ['Pedidos no período', list.length],
          ['Valor de pedidos ativos', money(total)],
          ['Pagamento confirmado manualmente', money(sum(confirmed))],
          [
            'Ticket médio dos pedidos ativos',
            money(active.length ? total / active.length : 0)
          ],
          ['Pedidos cancelados', list.length - active.length],
          [
            'Aguardando confirmação',
            active.filter(order =>
              order.status === 'Aguardando confirmação da loja'
            ).length
          ]
        ]
      : [
          ['Produtos disponíveis', catalog.length],
          [
            'Clientes cadastrados',
            users.filter(user => user.role === 'cliente').length
          ],
          ['Mensagens recebidas', messages.length]
        ];

    $('business-stats').innerHTML = metrics
      .map(([label, value]) => `
        <div class="stat">
          <span>${esc(label)}</span>
          <strong>${esc(value)}</strong>
        </div>
      `).join('');

    const months = {};
    const states = {};
    const tops = {};

    for (const order of list) {
      const day = new Date(order.created * 1000);
      const key = day.getFullYear() + '-' +
        String(day.getMonth() + 1).padStart(2, '0');

      months[key] = (months[key] || 0) + 1;
      states[order.status] = (states[order.status] || 0) + 1;

      if (order.status !== 'Cancelado') {
        for (const item of JSON.parse(order.data).items) {
          const productId = String(item.id);
          tops[productId] ??= { name: item.name, qty: 0 };
          tops[productId].qty += Number(item.qty);
        }
      }
    }

    bars(
      'month-chart',
      Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]))
    );

    bars('status-chart', Object.entries(states));

    bars(
      'top-chart',
      Object.values(tops)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 8)
        .map(item => [item.name, item.qty])
    );

    $('report-summary').innerHTML = `
      <p>
        Loja ${esc(store)} •
        De ${esc($('date-from').value || 'início')}
        até ${esc($('date-to').value || 'hoje')} •
        Gerado em ${esc(new Date().toLocaleString('pt-BR'))}
      </p>
      ${$('business-stats').innerHTML}
    `;

    $('report-table').innerHTML = resources.includes('orders')
      ? `
        <table>
          <thead>
            <tr>
              <th>Pedido</th><th>Cliente</th><th>Data</th>
              <th>Status</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(order => `
              <tr>
                <td>${esc(order.id)}</td>
                <td>
                  ${esc(
                    order.customer || JSON.parse(order.data).contact.name
                  )}
                </td>
                <td>${date(order.created)}</td>
                <td>${esc(order.status)}</td>
                <td>${money(order.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : `
        <p class="muted">
          Relatório de pedidos disponível para administrador,
          vendas e financeiro.
        </p>
      `;
  }

  function renderTeam() {
    if (role !== 'admin') return;

    $('team-list').innerHTML = users.map(user => `
      <tr>
        <td>${esc(user.name)}</td>
        <td>${esc(user.email)}</td>
        <td>
          ${user.role === 'admin' ? 'Administrador' : `
            <select id="role-${user.id}">
              ${Object.entries(roles)
                .filter(([key]) => key !== 'admin')
                .map(([key, label]) => `
                  <option value="${key}"
                          ${key === user.role ? 'selected' : ''}>
                    ${label}
                  </option>
                `).join('')}
            </select>
          `}
        </td>
        <td>
          ${user.role === 'admin' ? 'Conta principal' : `
            <button data-saverole="${user.id}">Salvar função</button>
          `}
        </td>
      </tr>
    `).join('');
  }

  function csv(name, rows) {
    const cell = value => '"' +
      String(value ?? '')
        .replace(/^(?:\s*[=+@-]|[\t\r\n])/, "'$&")
        .replace(/"/g, '""') + '"';

    const blob = new Blob([
      '\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n')
    ], { type: 'text/csv;charset=utf-8' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = name;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $('export-orders').onclick = () => csv(
    'pedidos-loja-' + store + '.csv',
    [
      [
        'Pedido', 'Cliente', 'Data', 'Status', 'Subtotal',
        'Desconto', 'Frete', 'Total', 'Itens'
      ],
      ...selectedOrders().map(order => {
        const data = JSON.parse(order.data);
        return [
          order.id,
          order.customer || data.contact.name,
          date(order.created),
          order.status,
          data.subtotal,
          data.discount,
          data.shipping,
          order.total,
          data.items.map(item =>
            `${item.qty} x ${item.name} / ${item.size}`
          ).join(' | ')
        ];
      })
    ]
  );

  $('export-products').onclick = () => csv(
    'produtos-loja-' + store + '.csv',
    [
      [
        'ID', 'Nome', 'Categoria', 'Preço', 'Descrição',
        'Estoque (27) / tamanhos (47)'
      ],
      ...catalog.map(product => [
        product.id,
        pname(product),
        pcat(product),
        pprice(product),
        product.desc || product.description || product.short,
        store === '27'
          ? Object.entries(product.estoque || {})
              .map(([size, qty]) => size + ': ' + qty)
              .join(' | ')
          : (product.sizes || []).join(', ')
      ])
    ]
  );

  $('apply-period').onclick = () => {
    if (
      $('date-from').value && $('date-to').value &&
      $('date-from').value > $('date-to').value
    ) {
      notice('A data inicial deve ser anterior à final.');
      return;
    }

    notice('');
    renderBusiness();
  };

  $('refresh-data').onclick = () => run(load);
  $('product-search').oninput = renderProducts;
  $('order-search').oninput = renderOrders;
  $('print-report').onclick = () => window.print();
  $('close-detail').onclick = () => $('detail-dialog').close();

  document.addEventListener('submit', event => {
    if (event.target.id !== 'order-note-form') return;

    event.preventDefault();

    run(async () => {
      await api('admin/order-notes', 'POST', {
        id: event.target.dataset.id,
        note: new FormData(event.target).get('note')
      });

      $('detail-dialog').close();
      await load();
      notice('Observações do pedido salvas.');
    });
  });

  $('team-form').onsubmit = event => {
    event.preventDefault();

    run(async () => {
      const data = Object.fromEntries(new FormData(event.target));
      await api('admin/team', 'POST', data);
      event.target.reset();
      await load();
      notice('Integrante criado com as permissões da função escolhida.');
    });
  };

  const fields27 = [
    ['id', 'ID numérico', 'number'],
    ['nome', 'Nome'],
    ['preco', 'Preço', 'number'],
    ['de', 'Preço anterior (0 para desativar)', 'number'],
    ['cat', 'Categoria: cargo, baggy, flare, reta, balao ou moletom'],
    ['img', 'Imagem: images/foto.jpg'],
    ['cores', 'Cores separadas por vírgula'],
    ['tags', 'Tags: destaque, novo (separadas por vírgula)'],
    ['P', 'Estoque P', 'number'],
    ['M', 'Estoque M', 'number'],
    ['G', 'Estoque G', 'number'],
    ['GG', 'Estoque GG', 'number'],
    ['desc', 'Descrição', 'textarea']
  ];

  const fields47 = [
    ['id', 'ID: letras minúsculas, números e hífen'],
    ['name', 'Nome'],
    ['price', 'Preço', 'number'],
    ['category', 'Categoria: polos ou blusas'],
    ['tag', 'Tag: Novo, Best seller…'],
    ['sizes', 'Tamanhos separados por vírgula'],
    ['images', 'Imagens: ../img/foto.jpg (separe por vírgula)'],
    ['short', 'Descrição curta'],
    ['description', 'Descrição completa', 'textarea']
  ];

  const fields = store === '27' ? fields27 : fields47;

  function edit(product = {}) {
    $('form-title').textContent =
      product.id ? 'Editar produto' : 'Novo produto';

    $('product-fields').innerHTML = fields
      .map(([id, label, type]) => {
        let value = product[id] ?? product.estoque?.[id] ??
          (type === 'number' ? 0 : '');

        if (Array.isArray(value)) value = value.join(', ');

        const step = ['price', 'preco', 'de'].includes(id)
          ? '0.01'
          : '1';

        return `
          <label class="${type === 'textarea' ? 'wide' : ''}">
            ${esc(label)}
            ${type === 'textarea' ? `
              <textarea id="f-${id}">${esc(value)}</textarea>
            ` : `
              <input
                id="f-${id}"
                value="${esc(value)}"
                type="${type || 'text'}"
                ${type === 'number' ? `min="0" step="${step}"` : ''}
                ${id === 'id' && product.id ? 'readonly' : ''}
              >
            `}
          </label>
        `;
      }).join('');

    $('product-form').hidden = false;
    $('product-form').scrollIntoView({ behavior: 'smooth' });
  }

  $('new-product').onclick = () => edit();

  $('cancel-edit').onclick = () => {
    $('product-form').hidden = true;
  };

  $('product-form').onsubmit = event => {
    event.preventDefault();

    run(async () => {
      const product = {};

      fields.forEach(([id, label, type]) => {
        product[id] = type === 'number'
          ? Number($('f-' + id).value)
          : $('f-' + id).value.trim();
      });

      const list = value => value.split(',')
        .map(item => item.trim())
        .filter(Boolean);

      if (store === '27') {
        product.cores = list(product.cores);
        product.tags = list(product.tags);
        product.estoque = {
          P: product.P,
          M: product.M,
          G: product.G,
          GG: product.GG
        };
      } else {
        product.sizes = list(product.sizes);
        product.images = list(product.images);
      }

      await api('admin/products', 'POST', product);
      $('product-form').hidden = true;
      await load();
      notice('Produto salvo. A loja já usa o catálogo atualizado.');
    });
  };

  document.addEventListener('click', event => {
    const data = event.target.dataset;

    if (data.saverole) {
      run(async () => {
        await api('admin/team', 'POST', {
          id: Number(data.saverole),
          role: $('role-' + data.saverole).value
        });

        await load();
        notice('Função atualizada.');
      });
    }

    if (data.productdetail !== undefined) {
      const product = catalog[Number(data.productdetail)];

      const stock = store === '27'
        ? Object.entries(product.estoque || {})
            .map(([size, qty]) => size + ': ' + qty)
            .join(' • ')
        : (product.sizes || []).join(', ');

      details(pname(product), `
        <p>
          <strong>ID:</strong> ${esc(product.id)} •
          <strong>Categoria:</strong> ${esc(pcat(product))}
        </p>
        <p><strong>Preço:</strong> ${money(pprice(product))}</p>
        <p class="description">
          ${esc(
            product.desc || product.description ||
            product.short || 'Sem descrição'
          )}
        </p>
        <p>
          <strong>Cores:</strong>
          ${esc((product.cores || []).join(', ') || 'Não informadas')}
        </p>
        <p><strong>Estoque / tamanhos:</strong> ${esc(stock)}</p>
      `);
    }

    if (data.orderdetail !== undefined) {
      const order = orders[Number(data.orderdetail)];
      const x = JSON.parse(order.data);

      details('Pedido ' + order.id, `
        <p>${date(order.created)} • ${esc(order.status)}</p>
        <h3>Cliente e entrega</h3>
        <p>
          ${esc(x.contact.name)}<br>
          ${esc(x.contact.phone)}<br>
          ${esc(x.contact.address || 'A combinar')}
        </p>

        <h3>Itens</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th><th>Variação</th><th>Qtd.</th>
                <th>Unitário</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${x.items.map(item => `
                <tr>
                  <td>
                    ${esc(item.name)}<br>#${esc(item.id)}
                    <p class="small description">
                      ${esc(item.description || '')}
                    </p>
                  </td>
                  <td>${esc(item.size)} ${esc(item.color || '')}</td>
                  <td>${item.qty}</td>
                  <td>${money(item.price)}</td>
                  <td>${money(item.qty * item.price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <p>
          Subtotal: ${money(x.subtotal)}<br>
          Desconto: ${money(x.discount)}<br>
          Frete: ${money(x.shipping)}<br>
          <strong>Total: ${money(order.total)}</strong>
        </p>

        <p class="muted">
          ${x.payment_confirmed
            ? 'Pagamento confirmado manualmente pela equipe.'
            : 'Não há registro de confirmação manual de pagamento neste pedido.'
          }
        </p>

        <h3>Observações internas</h3>
        ${['admin', 'vendas'].includes(role) ? `
          <form id="order-note-form" data-id="${esc(order.id)}">
            <label>
              Orientações para a equipe
              <textarea name="note" maxlength="4000">${esc(
                x.internal_note || ''
              )}</textarea>
            </label>
            <button type="submit">Salvar observações</button>
          </form>
        ` : `
          <p class="description">
            ${esc(x.internal_note || 'Nenhuma observação registrada.')}
          </p>
        `}

        <h3>Histórico de status</h3>
        ${(x.history || []).length
          ? x.history.slice().reverse().map(history => `
              <p class="small">
                ${date(history.at)} • ${esc(history.by)}
                (${esc(roles[history.role] || history.role)})<br>
                ${esc(history.from)} → ${esc(history.to)}
              </p>
            `).join('')
          : `
              <p class="muted">
                Nenhuma alteração registrada após esta atualização.
              </p>
            `
        }
      `);
    }

    if (data.tab) {
      document.querySelectorAll('.panel').forEach(panel => {
        panel.hidden = panel.id !== data.tab;
      });

      document.querySelectorAll('[data-tab]').forEach(button => {
        button.classList.toggle('active', button === event.target);
      });
    }

    if (data.edit !== undefined) {
      edit(catalog[Number(data.edit)]);
    }

    const deletions = [
      ['delete', 'products'],
      ['deluser', 'users'],
      ['delmessage', 'messages'],
      ['delreview', 'reviews']
    ];

    for (const [key, route] of deletions) {
      if (data[key] && confirm('Excluir este registro?')) {
        run(async () => {
          await api('admin/' + route + '/' + data[key], 'DELETE');
          await load();
        });
      }
    }
  });

  document.addEventListener('change', event => {
    if (!event.target.dataset.status) return;

    run(async () => {
      if (
        event.target.value === 'Cancelado' &&
        !confirm(
          'Cancelar pedido? No 27, as peças reservadas voltam ao estoque.'
        )
      ) {
        await load();
        return;
      }

      await api('admin/order-status', 'POST', {
        id: event.target.dataset.status,
        status: event.target.value
      });

      await load();
      notice('Status atualizado.');
    });
  });

  $('logout').onclick = () => run(async () => {
    await api('logout', 'POST');
    location.href = 'login.html';
  });

  run(async () => {
    const me = await api('me');
    const permissions = await api('admin/permissions');

    role = permissions.role;
    resources = permissions.resources;

    $('admin-name').textContent =
      (me.user?.name || '') + ' • ' + (roles[role] || role);

    document.querySelectorAll('[data-tab]').forEach(button => {
      button.hidden =
        !['overview', 'reports'].includes(button.dataset.tab) &&
        !resources.includes(button.dataset.tab);
    });

    $('new-product').hidden = !['admin', 'catalogo'].includes(role);
    $('export-orders').hidden = !resources.includes('orders');
    $('export-products').hidden = !resources.includes('products');

    await load();
  });
})();
