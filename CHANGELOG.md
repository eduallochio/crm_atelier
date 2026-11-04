# Changelog

## [1.12.0](https://github.com/eduallochio/crm_atelier/compare/v1.11.0...v1.12.0) (2026-11-04)


### Features

* adiciona cadastro de categorias de produto e previsão de fechamento no caixa ([4d5735c](https://github.com/eduallochio/crm_atelier/commit/4d5735c5f48224f438b883044f238b7e99fb95d3))
* **assinatura:** formulário de cartão no novo padrão do Atelier ([d844c14](https://github.com/eduallochio/crm_atelier/commit/d844c1434e312c47c9630dc0b55e38b5ee3ea74e))
* permite editar itens/valor de OS e fecha caixa automaticamente via cron ([461800b](https://github.com/eduallochio/crm_atelier/commit/461800b12882f34d0101451ac42a56fef7a14e27))


### Bug Fixes

* corrige 11 vulnerabilidades encontradas em auditoria de segurança ([27ce4e7](https://github.com/eduallochio/crm_atelier/commit/27ce4e7443eb37a2e1c2d91c0e51a504f7aed31c))
* corrige hydration mismatch recorrente e unhandledrejection em erro de caixa ([2990f63](https://github.com/eduallochio/crm_atelier/commit/2990f632a449ba0e58539df4771979599923553d))
* corrige responsividade mobile no painel admin de organizações ([923b1bb](https://github.com/eduallochio/crm_atelier/commit/923b1bbce354c14490fac3104ca7cabd4ead8933))
* remove card "Em Trial" do painel admin, nunca usado no sistema ([885dd84](https://github.com/eduallochio/crm_atelier/commit/885dd84b5cd4a6c112bcdbf0d2703a494c2e14ea))
* reverte tentativa de habilitar SSR no Sidebar ([45c8b85](https://github.com/eduallochio/crm_atelier/commit/45c8b852a7277ac4a718613ac183ac729fc6d55b))

## [1.11.0](https://github.com/eduallochio/crm_atelier/compare/v1.10.2...v1.11.0) (2026-11-01)


### Features

* adiciona modal de boas-vindas personalizado antes do tour guiado ([61fc4bb](https://github.com/eduallochio/crm_atelier/commit/61fc4bbc87cbc7c88f567a469020551da22b97c8))
* adiciona structured data Organization na landing page para SEO ([d113501](https://github.com/eduallochio/crm_atelier/commit/d1135011bdb4f5f54d2e21a3c150398f2fcce844))
* bloqueia acesso de organizações suspensas pelo admin ([cd01488](https://github.com/eduallochio/crm_atelier/commit/cd01488d636e39f1bf621976848ceca26611f17b))
* exibe organização nos erros de servidor do painel admin ([35da5f9](https://github.com/eduallochio/crm_atelier/commit/35da5f9ad93afc7517ef1f97b899da8a2aa78a10))
* mostra método de login (email ou Google) na lista de usuários do admin ([620d826](https://github.com/eduallochio/crm_atelier/commit/620d8263f5548c955e2db2bd8c056a8bd056f0be))
* mostra saldo atualizado no toast ao registrar entrada/saída de estoque ([9cb5693](https://github.com/eduallochio/crm_atelier/commit/9cb56935d93978890b6c911e47a41ecc9e9a1f52))
* mostra valor líquido e taxa do Asaas na tabela de faturas ([4786b26](https://github.com/eduallochio/crm_atelier/commit/4786b26f7b0c879859eb257ec9113420a8ee4c5d))
* redes sociais e receita real na Visão Geral; total líquido no Faturamento Global ([3ff95a7](https://github.com/eduallochio/crm_atelier/commit/3ff95a7297af3d096a52f4f1919d1214381e3169))
* registra auditoria de exclusões em clientes, contas, usuários, serviços e caixas ([ce7175f](https://github.com/eduallochio/crm_atelier/commit/ce7175fb13727323ad809bf1485d95f66c2fda16))


### Bug Fixes

* adiciona statement_timeout ao pool do Drizzle para evitar 504 em produção ([409530a](https://github.com/eduallochio/crm_atelier/commit/409530a69d3765a44c78457862ec5366bf0d248d))
* corrige build de produção quebrado por bug do Turbopack em next/font/google ([5ab2bad](https://github.com/eduallochio/crm_atelier/commit/5ab2bad7c675b925913321d2c841b3b5ab5d7d1c))
* corrige entrada de estoque nunca salvando produto, nome e preço ([8b85402](https://github.com/eduallochio/crm_atelier/commit/8b85402d0df457af60e1f93db35f084d268ef4dc))
* corrige entrada de estoque quebrando com productId vazio e preço não salvo ([6b273a1](https://github.com/eduallochio/crm_atelier/commit/6b273a1c6a4d5bb5ff4d625bea85bff05b5cf13e))
* corrige estoque nunca atualizado e adiciona exclusão de lançamentos avulsos ([ae5d918](https://github.com/eduallochio/crm_atelier/commit/ae5d9188c66420ac8b647d067be4ac2cc8988b6f))
* corrige incremento de campos numéricos de quantidade e bloqueia scroll acidental ([f188047](https://github.com/eduallochio/crm_atelier/commit/f188047e6d4f623d9cc57ef54d3c350940a3197e))
* corrige scrollbar duplicado em páginas longas do dashboard ([b53d39d](https://github.com/eduallochio/crm_atelier/commit/b53d39d3c73da5d4a2355705cfacefcc2c8549c3))
* desconta taxa de mensageria do Asaas no Total Recebido ([9810cfe](https://github.com/eduallochio/crm_atelier/commit/9810cfe6cab9194b3fe5711252f06eaa39e3e657))
* remove duplicação de estoque — triggers do banco já faziam o cálculo ([09cb65c](https://github.com/eduallochio/crm_atelier/commit/09cb65cfe0150a2b024ac108007586f4dc8e9e07))
* remove ruído de localhost nas métricas de Análises ([05ea167](https://github.com/eduallochio/crm_atelier/commit/05ea167fb3cc12cf56835f58fd96ff0f7d1a4521))
