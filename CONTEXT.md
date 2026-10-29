# Hackblooma

Agenda de olimpíadas científicas do Instituto Blooma. Ajuda meninas muito determinadas a acompanhar as datas, as provas e os resultados de cada olimpíada do ano.

## Language

### Olimpíadas e datas

**Temporada**:
Um ano de olimpíadas (por exemplo, temporada 2027). A equipe Blooma abre cada temporada com a **Lista oficial** daquele ano. As datas começam como **Data a confirmar** e usam o ano anterior como estimativa.
_Avoid_: Edição (quando significa o ano todo), ciclo, ano letivo

**Olimpíada**:
Uma competição de conhecimento (por exemplo OBMEP, OBF, Quimeninas), com nome, sigla, área e site oficial.
_Avoid_: Prova (quando se fala da competição inteira), competição, torneio (como termo genérico)

**Fase**:
Uma etapa de prova dentro de uma olimpíada (1ª fase, 2ª fase, final), com a sua data ou período. Cada **Olimpíada** tem uma ou mais fases. A fase seguinte só aparece no calendário da menina quando ela passa na anterior.
_Avoid_: Rodada, etapa, nível (quando significa fase)

**Caminho**:
A ligação entre duas olimpíadas em que ir bem numa pode levar à outra. Por exemplo, a Jacob Palis leva à OBM e ao TM², e a olimpíada estadual de química leva à OBQ. Quando a menina anota um **Resultado** numa olimpíada com caminho, recebe um **Aviso** para conferir se foi convidada.
_Avoid_: Pré-requisito, classificatória, trilha

**Divulgação do resultado**:
O dia em que a olimpíada publica o resultado oficial de uma **Fase** no site dela. A menina recebe um aviso nesse dia.
_Avoid_: Resultado (quando se fala só da data)

**Data a confirmar**:
Uma data de **Fase** ou **Prazo de inscrição** que a olimpíada ainda não divulgou. O app mostra o mês provável com o selo "a confirmar" e avisa quando a data é confirmada.
_Avoid_: Data estimada, data provisória, TBD

**Lista oficial**:
O conjunto de olimpíadas e datas que a equipe Blooma mantém e corrige. É igual para todas as meninas.
_Avoid_: Catálogo, base, agenda geral

**Olimpíada extra**:
Uma olimpíada que uma menina acrescentou por conta própria porque não está na **Lista oficial**. Só ela vê.
_Avoid_: Olimpíada personalizada, olimpíada privada

**Quem pode participar**:
As regras de cada olimpíada sobre quem pode fazer a prova: série, tipo de escola (pública ou particular), só meninas ou só por convite. O app usa essas regras para separar o que é **Para você**.
_Avoid_: Requisitos, critérios, elegibilidade

**Para você**:
As olimpíadas da **Lista oficial** em que a menina pode participar, de acordo com o **Perfil escolar** dela. Elas aparecem primeiro. As outras aparecem mais abaixo, com o motivo de ela não poder participar.
_Avoid_: Recomendadas, sugeridas, filtradas

**Prazo de inscrição**:
O último dia para se inscrever numa olimpíada. Algumas olimpíadas não têm prazo porque são "por convite".
_Avoid_: Deadline, data limite

**Aviso**:
Um lembrete que chega à menina de três jeitos: por e-mail, como notificação no celular ou computador (o aviso que aparece na tela mesmo com o app fechado) e dentro do app. Chega 7 dias e 1 dia antes de um **Prazo de inscrição** ou de uma **Fase**, e no dia em que uma **Data a confirmar** é confirmada ou sai uma **Divulgação do resultado**. Ela só recebe avisos das olimpíadas em que tem uma **Participação**, e os avisos de prazo param quando ela marca "inscrita".
_Avoid_: Alerta, lembrete (como termo do produto). "Notificação" é só o nome de um dos três jeitos de receber o aviso.

**Próximos passos**:
A tela inicial da menina: uma lista curta, em ordem de data, do que vem nas próximas semanas nas olimpíadas em que ela tem uma **Participação**.
_Avoid_: Dashboard, painel, início, feed

### A menina e o que ela conquista

**Perfil escolar**:
A série e o tipo de escola (pública ou particular) da menina. Ela informa uma vez e atualiza quando muda.
_Avoid_: Cadastro, dados da aluna

**Participação**:
A decisão de uma menina de fazer uma olimpíada numa **Temporada**. Ela escolhe de novo a cada temporada. Começa como "vou participar" e passa a "inscrita" quando ela confirma que se inscreveu.
_Avoid_: Favorito, inscrição (quando se fala da escolha, e não do ato de se inscrever)

**Resultado**:
O que uma menina conseguiu numa **Fase**, anotado por ela: nota, se passou para a próxima fase, medalha ou menção honrosa. Os resultados de todas as temporadas formam o histórico dela.
_Avoid_: Nota (como termo geral), desempenho, score

### Pessoas

**Menina**:
A participante do programa que usa a agenda para planejar as olimpíadas dela. Só ela e a **Equipe Blooma** veem as participações e os resultados dela.
_Avoid_: Aluna, usuária, estudante

**Equipe Blooma**:
As mentoras e a coordenação do Instituto Blooma. Elas cuidam da **Lista oficial** e acompanham as meninas para lembrar, apoiar e comemorar.
_Avoid_: Admin, staff, professoras

**Acompanhamento**:
A tela inicial da **Equipe Blooma**. Mostra as meninas que "precisam de um empurrão" (o prazo de inscrição está perto e elas ainda não marcaram "inscrita") e os resultados recentes "para comemorar".
_Avoid_: Dashboard, relatório, monitoramento

## Example dialogue

> **Menina:** "Saiu o resultado da OBF?"
> **Blooma:** "A divulgação do resultado é amanhã. Quando sair, você recebe um aviso e pode anotar o seu resultado, por exemplo 'passei para a 2ª fase'."
> **Menina:** "E a OBM? Não aparece no meu Para você."
> **Blooma:** "A OBM é por convite. Ela está no caminho da Jacob Palis: se você for bem lá, recebe um aviso para conferir se foi convidada."
> **Mentora (no Acompanhamento):** "A inscrição da Quimeninas fecha em 3 dias e a Ana ainda está em 'vou participar'. Vou mandar uma mensagem para ela."

## Flagged ambiguities

- O app foi construído para vários grupos separados (Organization). No Hackblooma existe um grupo só, o Instituto Blooma, sem turmas: a **Equipe Blooma** vê todas as meninas. Quem entra com o Google entra nesse grupo na hora, sem convite.
- "Resultado" era usado para duas coisas diferentes. Agora a **Divulgação do resultado** é o dia em que sai a lista oficial, e o **Resultado** é o que a menina conquistou.
