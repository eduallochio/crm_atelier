#!/usr/bin/env python3
"""Gera os e-mails do Meu Atelier Sistema em HTML pronto para envio (tabelas + estilo inline)."""
import os, html, re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'emails')
os.makedirs(OUT, exist_ok=True)

INK   = '#2C1810'   # tinta — texto e faixa do topo
CARD  = '#FFF8F0'   # linho — fundo do cartão
BG    = '#F0E7DA'   # fundo externo
TERRA = '#A9532F'   # terracota escura — botões (5:1 com o linho)
TERRA_T = '#8A4B2C' # terracota para texto sobre linho (6,4:1)
GOLD  = '#D4A85A'   # dourado — a costura
MID   = '#6E5E4F'   # texto secundário (5,9:1)
LINE  = '#E4D6C3'

SERIF = "'Cormorant Garamond', Cormorant, Georgia, 'Times New Roman', serif"
SANS  = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"


def botao(texto, url):
    return f'''<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
          <tr>
            <td align="center" bgcolor="{TERRA}" style="border-radius:2px;">
              <a href="{url}" style="display:inline-block;padding:15px 34px;font-family:{SANS};font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{CARD};text-decoration:none;border-radius:2px;">{texto}</a>
            </td>
          </tr>
        </table>'''


def caixa(linhas, titulo=None):
    """Caixa de dados (recibo, uso do plano) com a borda costurada."""
    t = f'<p style="margin:0 0 12px;font-family:{SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:{MID};">{titulo}</p>' if titulo else ''
    linhas_html = ''
    for i, (rot, val) in enumerate(linhas):
        topo = f'border-top:1px solid {LINE};' if i else ''
        forte = 'font-weight:700;' if rot.lower() in ('total', 'valor pago') else ''
        linhas_html += f'''<tr>
              <td style="padding:9px 0;{topo}font-family:{SANS};font-size:14px;color:{MID};">{rot}</td>
              <td align="right" style="padding:9px 0;{topo}font-family:{SANS};font-size:14px;color:{INK};{forte}">{val}</td>
            </tr>'''
    return f'''<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;border:1px dashed {GOLD};border-radius:2px;">
          <tr><td style="padding:18px 20px;">
            {t}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">{linhas_html}</table>
          </td></tr>
        </table>'''


def passos(itens):
    """Lista numerada com o número dentro de um círculo costurado."""
    out = ''
    for i, (titulo, desc) in enumerate(itens, 1):
        out += f'''<tr>
              <td width="34" valign="top" style="padding:0 12px 16px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="28"><tr>
                  <td align="center" height="28" style="height:28px;border:1px dashed {GOLD};border-radius:14px;font-family:{SERIF};font-size:15px;color:{TERRA_T};">{i}</td>
                </tr></table>
              </td>
              <td valign="top" style="padding:0 0 16px;">
                <p style="margin:0;font-family:{SANS};font-size:15px;font-weight:700;color:{INK};">{titulo}</p>
                <p style="margin:2px 0 0;font-family:{SANS};font-size:14px;line-height:1.5;color:{MID};">{desc}</p>
              </td>
            </tr>'''
    return f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 4px;">{out}</table>'


def barra(pct_var, cor_var, rotulo):
    """Barra de uso do plano, em tabela (sem CSS moderno). A largura e a cor vêm dos dados."""
    return f'''<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 18px;">
          <tr><td style="padding:0 0 6px;font-family:{SANS};font-size:13px;color:{MID};">{rotulo}</td></tr>
          <tr><td bgcolor="{LINE}" style="border-radius:2px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="{pct_var}"><tr>
              <td bgcolor="{cor_var}" height="8" style="height:8px;font-size:0;line-height:0;border-radius:2px;">&nbsp;</td>
            </tr></table>
          </td></tr>
        </table>'''


BASE = '''<!doctype html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{assunto}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap');
  body {{ margin:0; padding:0; width:100% !important; }}
  a {{ color:{TERRA_T}; }}
  @media only screen and (max-width:620px) {{
    .wrap {{ width:100% !important; }}
    .pad {{ padding-left:22px !important; padding-right:22px !important; }}
    .h1 {{ font-size:28px !important; line-height:1.15 !important; }}
  }}
</style>
</head>
<body style="margin:0;padding:0;background-color:{BG};">
  <div style="display:none;font-size:1px;color:{BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{preheader}&#8199;&#65279;&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:{BG};">
    <tr><td align="center" style="padding:28px 12px 40px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:600px;">

        <!-- topo -->
        <tr>
          <td bgcolor="{INK}" align="center" class="pad" style="padding:26px 36px 22px;border-radius:2px 2px 0 0;">
            <p style="margin:0;font-family:{SERIF};font-size:23px;letter-spacing:.04em;color:{CARD};">Meu <span style="color:{GOLD};">Atelier</span></p>
          </td>
        </tr>
        <tr><td bgcolor="{INK}" style="padding:0 36px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td height="1" style="height:1px;border-top:1px dashed {GOLD};font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>

        <!-- corpo -->
        <tr>
          <td bgcolor="{CARD}" class="pad" style="padding:38px 36px 34px;">
            {corpo}
          </td>
        </tr>

        <!-- rodapé -->
        <tr>
          <td bgcolor="{CARD}" class="pad" style="padding:0 36px 32px;border-radius:0 0 2px 2px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
              <td height="1" style="height:1px;border-top:1px dashed {LINE};font-size:0;line-height:0;">&nbsp;</td>
            </tr></table>
            <p style="margin:18px 0 0;font-family:{SANS};font-size:12.5px;line-height:1.6;color:{MID};">
              {rodape}
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:20px 24px 0;">
            <p style="margin:0;font-family:{SANS};font-size:11.5px;line-height:1.6;color:{MID};">
              Meu Atelier Sistema · <a href="https://meuateliersistema.com.br" style="color:{MID};text-decoration:underline;">meuateliersistema.com.br</a><br>
              Dúvidas? Responda este e-mail: falamos com você em contato@meuateliersistema.com.br
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
'''


def h1(txt, em=None):
    if em:
        txt = txt.replace(em, f'<em style="font-style:normal;color:{TERRA_T};">{em}</em>')
    return f'<p class="h1" style="margin:0 0 14px;font-family:{SERIF};font-size:34px;line-height:1.1;font-weight:500;color:{INK};">{txt}</p>'


def p(txt, top=0):
    return f'<p style="margin:{top}px 0 14px;font-family:{SANS};font-size:15.5px;line-height:1.65;color:{MID};">{txt}</p>'


def nota(txt):
    return f'<p style="margin:16px 0 0;font-family:{SANS};font-size:13px;line-height:1.6;color:{MID};">{txt}</p>'


APP = '{{url_sistema}}'

EMAILS = {}

# ── 1. Confirmar e-mail (modelo do Supabase) ────────────────────────────────
EMAILS['01-confirmar-email'] = dict(
    assunto='Confirme seu e-mail — Meu Atelier Sistema',
    preheader='Um clique e sua conta está pronta.',
    corpo=h1('Falta um ponto para fechar', 'um ponto')
    + p('Clique no botão abaixo para confirmar seu e-mail e abrir o seu ateliê no sistema.')
    + botao('Confirmar meu e-mail', '{{ .ConfirmationURL }}')
    + nota('O link vale por 24 horas. Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all;color:%s;">{{ .ConfirmationURL }}</span>' % TERRA_T),
    rodape='Você recebeu este e-mail porque alguém usou este endereço para criar uma conta no Meu Atelier Sistema. Se não foi você, é só ignorar: a conta não é ativada sem esta confirmação.',
)

# ── 2. Redefinir senha (modelo do Supabase) ─────────────────────────────────
EMAILS['02-redefinir-senha'] = dict(
    assunto='Redefinir sua senha — Meu Atelier Sistema',
    preheader='Link para criar uma senha nova.',
    corpo=h1('Vamos trocar sua senha')
    + p('Clique no botão para criar uma senha nova. Enquanto você não fizer isso, a senha atual continua valendo.')
    + botao('Criar nova senha', '{{ .ConfirmationURL }}')
    + nota('O link vale por 1 hora. Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all;color:%s;">{{ .ConfirmationURL }}</span>' % TERRA_T),
    rodape='Se você não pediu para trocar a senha, ignore este e-mail. Nada muda e ninguém entra na sua conta por causa dele.',
)

# ── 3. Confirmar novo e-mail (modelo do Supabase) ───────────────────────────
EMAILS['03-trocar-email'] = dict(
    assunto='Confirme seu novo e-mail — Meu Atelier Sistema',
    preheader='Confirme o endereço novo para concluir a troca.',
    corpo=h1('Confirme o endereço novo')
    + p('Você pediu para trocar o e-mail da sua conta para <strong style="color:%s;">{{ .Email }}</strong>. Confirme para concluir.' % INK)
    + botao('Confirmar novo e-mail', '{{ .ConfirmationURL }}')
    + nota('Até confirmar, seu acesso continua pelo e-mail antigo.'),
    rodape='Se você não pediu esta troca, ignore este e-mail e troque sua senha por segurança.',
)

# ── 4. Boas-vindas ──────────────────────────────────────────────────────────
EMAILS['04-boas-vindas'] = dict(
    assunto='Bem-vinda ao Meu Atelier Sistema',
    preheader='Três passos e seu ateliê já está rodando.',
    corpo=h1('Seu ateliê está pronto, {{nome}}')
    + p('Que bom ter você aqui. Para o sistema começar a trabalhar por você hoje mesmo, faça estes três passos — leva uns dez minutos:')
    + passos([
        ('Cadastre seus serviços', 'Barra, ajuste, costura sob medida: com o preço de cada um, a ordem de serviço fica pronta em segundos.'),
        ('Cadastre a primeira cliente', 'Nome e WhatsApp já bastam. O resto você completa quando quiser.'),
        ('Crie a primeira ordem de serviço', 'Escolha a cliente, os serviços e a data de entrega. O sistema cuida do resto.'),
    ])
    + botao('Abrir meu painel', APP)
    + nota('Ficou com dúvida em algum passo? Responda este e-mail que a gente ajuda.'),
    rodape='Você recebeu este e-mail porque criou uma conta no Meu Atelier Sistema.',
)

# ── 5. Convite para a equipe ────────────────────────────────────────────────
EMAILS['05-convite-equipe'] = dict(
    assunto='{{dona}} convidou você para o {{atelie}}',
    preheader='Crie sua senha e entre no ateliê.',
    corpo=h1('Você foi convidada para o {{atelie}}')
    + p('<strong style="color:%s;">{{dona}}</strong> criou um acesso para você no Meu Atelier Sistema, o sistema onde o ateliê controla clientes, ordens de serviço e entregas.' % INK)
    + caixa([('Ateliê', '{{atelie}}'), ('Seu acesso', '{{email}}'), ('Permissão', '{{papel}}')])
    + botao('Criar minha senha', '{{url_convite}}')
    + nota('O convite vale por 7 dias. Depois disso, peça para {{dona}} enviar outro.'),
    rodape='Você recebeu este e-mail porque {{dona}} cadastrou este endereço no ateliê dela. Se não reconhece o convite, é só ignorar.',
)

# ── 6. Pagamento confirmado ─────────────────────────────────────────────────
EMAILS['06-pagamento-confirmado'] = dict(
    assunto='Pagamento confirmado — seu plano Pro está ativo',
    preheader='Tudo liberado: financeiro, estoque e cadastros sem limite.',
    corpo=h1('Seu plano <em>Pro</em> está ativo')
    + p('O pagamento caiu e já liberamos tudo na sua conta: clientes, serviços e ordens sem limite, mais o financeiro, o caixa e o estoque.')
    + caixa([
        ('Plano', 'Pro {{ciclo}}'),
        ('Forma de pagamento', '{{forma}}'),
        ('Data', '{{data}}'),
        ('Próxima renovação', '{{proxima_renovacao}}'),
        ('Valor pago', '{{valor}}'),
    ], titulo='Recibo')
    + botao('Começar a usar', APP)
    + nota('O comprovante oficial vem do Asaas, que processa o pagamento. Para cancelar, é em Configurações › Assinatura, sem precisar falar com ninguém.'),
    rodape='Você recebeu este e-mail porque assinou o plano Pro do Meu Atelier Sistema.',
)

# ── 7. PIX aguardando pagamento ─────────────────────────────────────────────
EMAILS['07-pix-aguardando'] = dict(
    assunto='Seu PIX está esperando — Meu Atelier Sistema',
    preheader='Assim que o pagamento cair, o Pro é ativado sozinho.',
    corpo=h1('Seu PIX está esperando')
    + p('Falta só o pagamento para liberar o plano Pro. Assim que o PIX cair, a conta vira Pro sozinha — você não precisa avisar ninguém.')
    + caixa([('Valor', '{{valor}}'), ('Válido até', '{{validade}}')])
    + botao('Pagar agora', '{{url_pagamento}}')
    + f'<p style="margin:18px 0 6px;font-family:{SANS};font-size:13px;font-weight:700;color:{INK};">Ou use o código copia e cola:</p>'
    + f'<p style="margin:0;padding:12px 14px;border:1px solid {LINE};border-radius:2px;font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.5;color:{MID};word-break:break-all;">{{{{pix_copia_cola}}}}</p>',
    rodape='Você recebeu este e-mail porque iniciou uma assinatura no Meu Atelier Sistema. Se desistiu, é só não pagar: nada é cobrado.',
)

# ── 8. Pagamento atrasado ───────────────────────────────────────────────────
EMAILS['08-pagamento-atrasado'] = dict(
    assunto='Não conseguimos confirmar seu pagamento',
    preheader='Regularize para não perder o acesso Pro.',
    corpo=h1('Não conseguimos confirmar seu pagamento')
    + p('A cobrança do seu plano Pro venceu em <strong style="color:%s;">{{vencimento}}</strong> e ainda não foi confirmada. Pode ter sido um cartão vencido, um limite ou um PIX que ficou pela metade.' % INK)
    + caixa([('Plano', 'Pro {{ciclo}}'), ('Valor', '{{valor}}'), ('Venceu em', '{{vencimento}}')])
    + p('Seu acesso continua liberado até <strong style="color:%s;">{{prazo}}</strong>. Depois disso a conta volta para o plano Free e os módulos de financeiro e estoque ficam bloqueados — seus dados continuam todos guardados.' % INK)
    + botao('Regularizar agora', '{{url_pagamento}}')
    + nota('Se já pagou nas últimas horas, pode ignorar: a confirmação do banco às vezes demora.'),
    rodape='Você recebeu este e-mail porque tem uma assinatura ativa no Meu Atelier Sistema.',
)

# ── 9. Limite do plano Free ─────────────────────────────────────────────────
EMAILS['09-limite-plano'] = dict(
    assunto='Você já usou {{percentual}} do plano Free',
    preheader='Veja quanto falta antes de travar os cadastros.',
    corpo=h1('Seu ateliê está crescendo')
    + p('Boa notícia e um aviso: você já usou boa parte do que o plano Free oferece. Quando o limite fecha, não dá para cadastrar mais — mas nada do que já existe se perde.')
    + barra('{{pct_clientes}}', '{{cor_clientes}}', 'Clientes · {{clientes_uso}} de {{clientes_max}}')
    + barra('{{pct_ordens}}', '{{cor_ordens}}', 'Ordens de serviço · {{ordens_uso}} de {{ordens_max}}')
    + barra('{{pct_servicos}}', '{{cor_servicos}}', 'Serviços · {{servicos_uso}} de {{servicos_max}}')
    + p('No plano Pro esses três viram ilimitados, e entram o financeiro, o caixa e o controle de estoque.')
    + botao('Conhecer o plano Pro', APP + '/configuracoes?tab=assinatura')
    + nota('Prefere continuar no Free? Sem problema: é só apagar o que não usa mais para abrir espaço.'),
    rodape='Você recebeu este e-mail porque sua conta Free está perto do limite. Para não receber mais avisos assim, responda este e-mail.',
)

# ── 10. Assinatura cancelada ────────────────────────────────────────────────
EMAILS['10-assinatura-cancelada'] = dict(
    assunto='Sua assinatura foi cancelada',
    preheader='Seus dados continuam guardados.',
    corpo=h1('Sua assinatura foi cancelada')
    + p('Pronto, cancelamos como você pediu. Não haverá nova cobrança.')
    + caixa([('Plano cancelado', 'Pro {{ciclo}}'), ('Acesso Pro até', '{{fim_acesso}}'), ('Cobranças futuras', 'nenhuma')])
    + p('Tudo que você cadastrou continua no lugar: clientes, ordens, histórico. O que muda são os limites do plano Free e o acesso ao financeiro e ao estoque.')
    + botao('Voltar para o Pro', APP + '/configuracoes?tab=assinatura')
    + nota('Se cancelou porque faltava alguma coisa no sistema, responda contando o quê. A gente lê tudo.'),
    rodape='Você recebeu este e-mail porque cancelou a assinatura do Meu Atelier Sistema.',
)


def build():
    nomes = []
    for nome, d in EMAILS.items():
        htmlout = BASE.format(
            assunto=html.escape(d['assunto']).replace('&#123;', '{'),
            preheader=d['preheader'],
            corpo=d['corpo'],
            rodape=d['rodape'],
            INK=INK, CARD=CARD, BG=BG, TERRA=TERRA, TERRA_T=TERRA_T,
            GOLD=GOLD, MID=MID, LINE=LINE, SERIF=SERIF, SANS=SANS,
        )
        with open(os.path.join(OUT, nome + '.html'), 'w', encoding='utf-8') as f:
            f.write(htmlout)
        nomes.append((nome, d['assunto']))
    return nomes


if __name__ == '__main__':
    for n, a in build():
        print(n, '→', a)
