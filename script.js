(() => {
  'use strict';
  const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const materials={latinha:['Latinha',7,'kg'],cobre:['Cobre',50,'kg'],metal:['Metal / Latão',20,'kg'],perfil:['Perfil / Panela',8,'kg'],aluminio:['Alumínio Grosso / Duro',4,'kg'],pet:['PET',1,'kg'],plastico:['Plástico',.8,'kg'],filme:['Plástico Filme',.8,'kg'],ferro:['Ferro',.5,'kg'],papel:['Papel',.1,'kg'],garrafa:['Garrafa tipo Ypióca',.25,'unidade'],placa:['Placa',3,'kg']};
  const wa=text=>'https://wa.me/5585985625203?text='+encodeURIComponent(text);
  let unit='todos';
  const search=document.getElementById('search');
  const cards=[...document.querySelectorAll('.price-card')];
  const empty=document.createElement('p');empty.textContent='Nenhum material encontrado.';empty.hidden=true;document.getElementById('price-list').after(empty);
  function filter(){let n=0;cards.forEach(c=>{const show=(unit==='todos'||c.dataset.unit===unit)&&norm(c.dataset.name).includes(norm(search.value));c.hidden=!show;if(show)n++;});empty.hidden=n>0;}
  search.addEventListener('input',filter);
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{unit=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});filter();}));
  const select=document.getElementById('calc-material'),qty=document.getElementById('calc-qty');
  function calc(){const [name,price,u]=materials[select.value];let q=Math.max(0,Number(qty.value)||0);if(u==='unidade')q=Math.floor(q);qty.step=u==='unidade'?'1':'0.1';document.getElementById('calc-total').textContent=money(price*q);document.getElementById('calc-desc').textContent=`${name} • ${q} ${u}`;document.getElementById('formula').textContent=`${q} ${u} × ${money(price)} = ${money(q*price)}`;document.getElementById('calc-wa').href=wa(`Olá! Tenho ${q} ${u} de ${name}. Estimativa do site: ${money(q*price)}. Gostaria de confirmar o valor.`);}
  select.addEventListener('change',calc);qty.addEventListener('input',calc);calc();
  const form=document.getElementById('collect-form');form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const value=id=>document.getElementById(id).value;window.open(wa(`Olá! Quero solicitar coleta. Nome: ${value('nome')}. Telefone: ${value('telefone')}. Endereço: ${value('endereco')}. Material: ${materials[value('form-material')][0]}. Quantidade aproximada: ${value('quantidade')}. Observações: ${value('observacoes')}.`),'_blank','noopener');});
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible','is-in'));
  const toggle=document.querySelector('.mobile-toggle'),nav=document.querySelector('.desktop-nav');toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open);});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));
})();
