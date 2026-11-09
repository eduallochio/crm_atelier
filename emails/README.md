# E-mails do Meu Atelier Sistema

Dez modelos em HTML, prontos para enviar. Tudo em tabela com estilo inline, que é o que
funciona em Gmail, Outlook, Apple Mail e nos aplicativos de celular. Sem imagem: o topo é
texto, e a costura dourada é uma borda tracejada, então o e-mail aparece inteiro mesmo com
as imagens bloqueadas.

## Os três primeiros vão no Supabase

`01`, `02` e `03` usam as variáveis do próprio Supabase (`{{ .ConfirmationURL }}`,
`{{ .Email }}`). Cole o HTML em Authentication › Emails, nos modelos **Confirm signup**,
**Reset password** e **Change email address**.

## Os outros sete são enviados pelo sistema

Troque os `{{marcadores}}` antes de enviar:

| Arquivo | Marcadores |
|---|---|
| `04-boas-vindas` | `nome`, `url_sistema` |
| `05-convite-equipe` | `dona`, `atelie`, `email`, `papel`, `url_convite` |
| `06-pagamento-confirmado` | `ciclo`, `forma`, `data`, `proxima_renovacao`, `valor`, `url_sistema` |
| `07-pix-aguardando` | `valor`, `validade`, `url_pagamento`, `pix_copia_cola` |
| `08-pagamento-atrasado` | `ciclo`, `valor`, `vencimento`, `prazo`, `url_pagamento` |
| `09-limite-plano` | `percentual`, `*_uso`, `*_max`, `pct_*` (ex.: `92%`), `cor_*` |
| `10-assinatura-cancelada` | `ciclo`, `fim_acesso`, `url_sistema` |

Em `09`, `pct_*` é a largura da barra (`"92%"`) e `cor_*` é a cor dela:
`#D4A85A` até 79%, `#A9532F` de 80 a 99%, `#B3261E` em 100%.

## Assuntos

1. Confirme seu e-mail — Meu Atelier Sistema
2. Redefinir sua senha — Meu Atelier Sistema
3. Confirme seu novo e-mail — Meu Atelier Sistema
4. Bem-vinda ao Meu Atelier Sistema
5. {{dona}} convidou você para o {{atelie}}
6. Pagamento confirmado — seu plano Pro está ativo
7. Seu PIX está esperando — Meu Atelier Sistema
8. Não conseguimos confirmar seu pagamento
9. Você já usou {{percentual}} do plano Free
10. Sua assinatura foi cancelada

## Remetentes

- **De:** `Meu Atelier Sistema <nao-responda@meuateliersistema.com.br>`
- **Responder para:** `contato@meuateliersistema.com.br`
- Nos e-mails de cobrança (`06`, `07`, `08`), o remetente pode ser `financeiro@`.

## Paleta

Tinta `#2C1810` · linho `#FFF8F0` · fundo `#F0E7DA` · terracota `#A9532F` (botão, 5:1 com o
linho) · terracota de texto `#8A4B2C` · dourado `#D4A85A` (a costura) · texto secundário
`#6E5E4F` · linha `#E4D6C3`.

Cormorant Garamond e DM Sans são carregadas quando o programa de e-mail permite; quando
não, caem em Georgia e na fonte do sistema, que é o caso do Gmail.

Gerado por `build.py` — mexa no conteúdo lá e rode `python3 build.py` para refazer os HTML.
