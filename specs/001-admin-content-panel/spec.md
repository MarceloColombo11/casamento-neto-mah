# Feature Specification: Painel admin dos noivos

**Feature Branch**: `001-admin-content-panel`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Gostaria de adicionar uma rota de admin, para que os noivos possam adicionar as fotos, adicionar os textos, adicionar os presentes na lista de presentes. Deve ser um painel fácil de mexer com uma boa UI/UX. Se possível adicionar um database gratuito para facilitar esse CRUD. Por exemplo para a parte de presentes, que precisa de título, descrição, pix e imagem. Devemos ter um login padrão para essa página de admin para os noivos poderem gerir os dados."

## Clarifications

### Session 2026-09-17

- Q: Quando o painel dos noivos entrar no ar, o que deve acontecer com os presentes, fotos e textos que o site já mostra hoje? → A: Tudo o que está no site hoje vira o conteúdo inicial do painel, inclusive os presentes de exemplo.
- Q: Quando os noivos confirmam “remover” um presente ou uma foto, o item some para sempre ou só deixa de aparecer no site público? → A: Remoção definitiva: some do painel e do site público; não dá para restaurar.
- Q: Depois que os noivos entram no painel, por quanto tempo a sessão permanece válida se eles não saírem? → A: 8 horas a partir da entrada.
- Q: Quantas fotos os noivos podem ter ao mesmo tempo na capa e em “Nossa História”? → A: Até 8 na capa e até 12 em Nossa História.
- Q: Nos blocos de texto (Nossa História, Traje, Grande Dia), os noivos só editam campos fixos ou podem incluir e apagar parágrafos? → A: Incluir e apagar parágrafos um a um, com botões de adicionar/remover.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar e sair da área dos noivos (Priority: P1)

Os noivos recebem um endereço privado da área de gestão (não aparece no menu público). Abrem esse endereço no celular ou no computador, informam identificador e senha compartilhados do casal, e entram num painel em português, simples, com três áreas claras: Presentes, Fotos e Textos. Podem sair com um controle visível de “sair”. Quem não está autenticado não vê nem altera nenhum conteúdo de gestão.

**Why this priority**: Sem acesso protegido, o restante do painel não pode existir. A constituição já prevê autenticação real apenas para os noivos, quando a área administrativa for especificada.

**Independent Test**: Com credenciais válidas, o casal entra e vê o painel. Com credenciais inválidas ou sem sessão, o visitante permanece na tela de entrada e nenhuma alteração de conteúdo é possível.

**Acceptance Scenarios**:

1. **Given** um visitante sem sessão, **When** tenta abrir qualquer tela de gestão, **Then** vê apenas a tela de entrada e não consegue criar, editar ou apagar conteúdo.
2. **Given** a tela de entrada, **When** o casal informa credenciais corretas, **Then** chega ao painel em menos de 10 segundos em conexão doméstica normal e vê as três áreas (Presentes, Fotos, Textos).
3. **Given** a tela de entrada, **When** informa credenciais erradas, **Then** recebe uma mensagem clara em português, sem revelar se o erro foi o identificador ou a senha, e permanece desautenticado.
4. **Given** várias tentativas falhas seguidas, **When** o limite de tentativas é atingido, **Then** novas tentativas são recusadas por um período e a mensagem não inclui dados pessoais.
5. **Given** uma sessão ativa, **When** o casal escolhe sair, **Then** a próxima visita à área de gestão exige nova autenticação.
6. **Given** uma entrada feita há mais de 8 horas, **When** o casal tenta usar o painel, **Then** é tratado como sem sessão e precisa entrar de novo.

---

### User Story 2 - Gerir a lista de presentes (Priority: P1)

Os noivos abrem a área Presentes e veem, já no primeiro acesso, a lista que o site público mostra hoje (incluindo os presentes de exemplo), em cartões fáceis de ler (título, imagem, se tem Pix). Podem adicionar um presente com título, descrição, chave Pix e imagem; editar qualquer campo; reordenar; e remover com confirmação. Ao salvar, o site público passa a mostrar exatamente essa lista — inclusive o Pix para o convidado copiar ou pagar — sem pedir ajuda a quem mantém o código.

**Why this priority**: É o exemplo que os noivos precisam resolver agora (título, descrição, Pix, imagem) e o conteúdo que hoje está só em arquivo, inacessível para o casal.

**Independent Test**: Autenticado, o casal cria um presente completo, confere no site público (em outra aba/janela anônima) e depois edita e remove o mesmo item.

**Acceptance Scenarios**:

1. **Given** o painel autenticado na área Presentes no primeiro uso, **When** o casal abre a lista, **Then** vê os mesmos presentes que o site público já exibia (incluindo os de exemplo), na mesma ordem.
2. **Given** o painel autenticado na área Presentes, **When** o casal preenche título, descrição, Pix e escolhe uma imagem e salva, **Then** o item aparece na lista do painel e na lista pública, com a imagem visível.
3. **Given** um presente já publicado, **When** o casal altera título, descrição, Pix ou imagem e salva, **Then** o site público mostra os novos dados na próxima visita, sem item duplicado.
4. **Given** um presente na lista, **When** o casal pede para remover e confirma, **Then** o item some do painel e do site público e não pode ser restaurado (só cadastrando de novo). Se cancelar a confirmação, o item permanece.
5. **Given** dois ou mais presentes, **When** o casal altera a ordem, **Then** o site público respeita a nova ordem.
6. **Given** um presente sem imagem, **When** o casal salva mesmo assim, **Then** o item é publicado com um visual genérico, sem quebrar a lista pública.
7. **Given** um convite no site público, **When** abre um presente que tem Pix, **Then** consegue ver a chave e copiá-la (ou usar o QR já existente na experiência pública). Se o Pix estiver vazio, a área de pagamento não promete uma chave inexistente.
8. **Given** um campo obrigatório vazio (título ou descrição), **When** tenta salvar, **Then** o painel aponta o campo em linguagem simples e não publica o item incompleto.

---

### User Story 3 - Trocar as fotos do site (Priority: P2)

Os noivos abrem a área Fotos e veem, já no primeiro acesso, as coleções atuais do site: fotos da capa (fundo da entrada) e fotos da seção “Nossa História” (hoje vazia, se o site ainda não tiver nenhuma). Podem enviar novas, remover, e reordenar. O site público usa só essas listas. Fotos enviadas por convidados (álbum da festa) não entram nesta tela.

**Why this priority**: Hoje as fotos da capa estão fixas no projeto e o carrossel da história está vazio; o casal precisa colocar as fotos reais sem um desenvolvedor. Vem depois dos presentes porque o casamento funciona sem fotos novas, mas não funciona bem sem lista de presentes.

**Independent Test**: Autenticado, o casal envia uma foto para a capa e outra para “Nossa História”, confirma no site público, remove uma, e vê a mudança.

**Acceptance Scenarios**:

1. **Given** a área Fotos no primeiro uso, **When** o casal abre a coleção Capa, **Then** vê as fotos que a entrada pública já exibia.
2. **Given** a área Fotos, **When** o casal envia uma imagem para a capa, **Then** ela aparece na pré-visualização do painel e no fundo da entrada pública.
3. **Given** a área Fotos, **When** o casal envia uma imagem para “Nossa História”, **Then** ela entra no carrossel público dessa seção.
4. **Given** várias fotos numa coleção, **When** o casal reordena ou remove (com confirmação), **Then** o site público reflete a coleção restante na ordem escolhida e a foto removida não volta ao painel.
5. **Given** uma imagem que não é um arquivo de foto aceitável, **When** tenta enviar, **Then** o painel recusa com mensagem clara e não altera o site público.
6. **Given** a coleção da capa vazia (depois de o casal remover todas), **When** um convidado abre o site, **Then** a entrada continua utilizável (sem quebrar a página), com um fundo simples no lugar das fotos.
7. **Given** a capa com 8 fotos (ou Nossa História com 12), **When** o casal tenta enviar mais uma, **Then** o painel recusa com mensagem clara e o site público não muda.

---

### User Story 4 - Editar os textos do site (Priority: P2)

Os noivos abrem a área Textos e encontram blocos nomeados, no mesmo português do site, não um editor técnico. Cada bloco corresponde a um trecho que o convidado lê hoje: mensagem sob a data na entrada, introdução de “O Grande Dia”, textos de Traje, título/subtítulo/parágrafos/assinatura de “Nossa História”, e introdução da lista de presentes. Em Grande Dia, Traje e Nossa História eles incluem e apagam parágrafos um a um. Salvam, e o site público mostra o novo texto.

**Why this priority**: Os textos atuais são placeholder. O casal precisa substituí-los. A lista nomeada evita um “CMS genérico” e mantém o painel fácil.

**Independent Test**: Autenticado, o casal altera um bloco (por exemplo Traje), salva, e lê o novo texto na seção pública correspondente.

**Acceptance Scenarios**:

1. **Given** a área Textos no primeiro uso, **When** o casal abre um bloco, **Then** vê o mesmo texto que o site público já exibia naquela seção, com o nome da seção em linguagem comum.
2. **Given** um bloco aberto, **When** altera o conteúdo e salva, **Then** a seção pública correspondente mostra o texto novo na próxima visita.
3. **Given** um bloco com campo obrigatório em branco (ex.: título de “Nossa História”), **When** tenta salvar, **Then** o painel impede a publicação e explica o que falta.
4. **Given** o casal no celular (~360px de largura), **When** edita e salva um bloco curto, **Then** consegue completar a tarefa sem rolagem horizontal nem controles inacessíveis.
5. **Given** o bloco Traje, Grande Dia ou Nossa História, **When** o casal adiciona um parágrafo, preenche e salva, **Then** o site público mostra o parágrafo novo naquela seção.
6. **Given** um bloco com mais de um parágrafo, **When** o casal remove um parágrafo e salva, **Then** aquele parágrafo some do site público. Se for o último parágrafo, o painel recusa até restar pelo menos um.

---

### Edge Cases

- Sessão expirada no meio de um formulário (incluindo após 8 horas da entrada): ao salvar, o casal é levado à entrada; o conteúdo não publicado não é aplicado ao site público; ao voltar, o painel avisa que precisa entrar de novo.
- Dois noivos editando o mesmo presente ao mesmo tempo: o último salvamento válido vence; ninguém perde o site público por conflito.
- Falha ao persistir (serviço de dados indisponível): o painel diz que não foi possível salvar e pede para tentar de novo; o site público permanece com a última versão boa. Não se perde um presente já publicado anterior.
- Falha ao enviar só a imagem, com os dados de texto já válidos: o presente ou a foto não é publicado pela metade; o casal vê o erro e pode tentar o envio de novo.
- Pix inválido ou muito curto: o painel avisa antes de publicar; não inventa chave.
- Imagem muito grande: o painel recusa ou reduz de forma transparente, com mensagem se precisar de um arquivo menor.
- Coleção no limite (8 na capa ou 12 em Nossa História): o envio extra é recusado; o casal precisa remover uma foto para caber outra.
- Endereço de gestão digitado por um convidado curioso: vê só a tela de entrada, sem lista de presentes internos, sem Pix extra, sem textos não publicados.
- Remoção confirmada de presente ou foto é definitiva: não há lixeira nem restaurar. Para ter o item de novo, o casal cadastra outra vez.
- Site público sem nenhum presente (somente depois de o casal remover todos; no lançamento a lista inicial inclui os itens atuais, mesmo que sejam exemplos): a seção de presentes continua no ar com uma mensagem curta de que a lista está sendo preparada.
- Caracteres especiais no título ou na descrição (aspas, emoji): são exibidos como o casal digitou, sem quebrar o layout público.
- Tentativa de salvar Grande Dia, Traje ou Nossa História sem nenhum parágrafo: o painel impede e pede pelo menos um.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer uma área de gestão exclusiva dos noivos, inacessível a partir da navegação pública do site.
- **FR-002**: O sistema MUST autenticar os noivos com um único par compartilhado de identificador e senha (“login padrão” do casal). Não há contas de convidado e não há papéis além de “casal autenticado”.
- **FR-003**: O sistema MUST manter a sessão após a entrada até o casal sair ou até 8 horas depois da entrada, o que ocorrer primeiro. Depois de 8 horas, qualquer ação de gestão MUST exigir nova autenticação.
- **FR-004**: O sistema MUST recusar credenciais inválidas com mensagem genérica, limitar tentativas repetidas a partir do mesmo origem, e registrar apenas identificador opaco + resultado da tentativa (sem senha, sem nome).
- **FR-005**: Visitantes não autenticados MUST NOT criar, alterar, reordenar ou apagar presentes, fotos ou textos.
- **FR-006**: O casal MUST poder criar, editar, reordenar e remover itens da lista de presentes. Campos de um presente: título (obrigatório), descrição (obrigatória), chave Pix (opcional, mas exigida para mostrar pagamento), imagem (opcional), valor sugerido (opcional, já usado na experiência pública atual).
- **FR-007**: O site público MUST exibir somente presentes persistidos pela gestão, na ordem definida pelo casal.
- **FR-022**: No primeiro uso, o sistema MUST copiar para a gestão o conteúdo público atual: lista de presentes (incluindo itens de exemplo), fotos da Capa e de Nossa História, e os blocos de texto de FR-011. Essa cópia MUST ocorrer uma vez; republicar o site MUST NOT restaurar os exemplos se o casal já tiver alterado ou removido itens.
- **FR-008**: Quando um presente publicado tiver Pix, o convidado MUST conseguir copiar a chave (e usar o QR já existente na experiência pública). A chave MUST aparecer só ao abrir aquele presente, não numa lista visível de todas as chaves ao mesmo tempo.
- **FR-009**: O casal MUST poder enviar, reordenar e remover fotos de duas coleções nomeadas: “Capa” e “Nossa História”. Cada foto pertence a exatamente uma coleção.
- **FR-024**: A coleção Capa MUST aceitar no máximo 8 fotos. A coleção Nossa História MUST aceitar no máximo 12 fotos. Ao atingir o limite, um envio extra MUST ser recusado com mensagem clara, sem alterar o site público.
- **FR-010**: O site público MUST usar as coleções geridas para o fundo da entrada (Capa) e para o carrossel de “Nossa História”.
- **FR-011**: O casal MUST poder editar os blocos de texto nomeados: mensagem da entrada (sob a data), introdução de “O Grande Dia”, textos de “Traje”, título, subtítulo, parágrafos e assinatura de “Nossa História”, e introdução da lista de presentes.
- **FR-025**: Nos blocos Grande Dia, Traje e corpo de Nossa História, o casal MUST poder incluir e apagar parágrafos um a um (controles de adicionar/remover). Mensagem da entrada, introdução dos presentes, título, subtítulo e assinatura permanecem campos únicos. Cada bloco com parágrafos MUST exigir pelo menos um parágrafo para salvar.
- **FR-012**: Salvamento bem-sucedido MUST tornar o conteúdo visível no site público sem exigir publicação num segundo passo e sem exigir alteração de código.
- **FR-013**: Conteúdo gerido pelos noivos MUST persistir de forma durável (sobrevive a republicar o site e a reabrir o navegador). Pedir que o casal altere arquivos do projeto NÃO atende, porque eles não operam o código. Planilha NÃO atende imagens nem um painel fácil no celular. Esta feature persiste dados de gestão — o casal é o autor, em tempo de uso — e não conteúdo estático que só o mantenedor consegue mudar.
- **FR-014**: A persistência MUST usar apenas serviço já aprovado na constituição, em plano gratuito permanente, com limite de gasto em zero. Nenhum serviço novo pago, trial ou com cartão obrigatório é introduzido. Volume esperado: dezenas de presentes e fotos, não milhares; pico na semana do casamento.
- **FR-015**: Imagens enviadas pelo casal MUST usar o armazenamento de mídia já previsto para o projeto (mesmo tipo de destino das mídias da festa: pasta restrita, sem listagem pública, sem endereço adivinhável). URLs entregues ao site público MUST ser as necessárias para exibir a foto, sem credencial de escrita.
- **FR-016**: Toda escrita MUST validar os campos antes de qualquer efeito (incluindo envio de arquivo). Arquivo que não for imagem aceitável MUST ser recusado.
- **FR-017**: O painel MUST ser utilizável em viewport de 360px: navegação entre áreas, formulários, envio de foto da galeria do celular, confirmação de exclusão e mensagens de sucesso/erro visíveis.
- **FR-018**: Ações destrutivas (remover presente ou foto) MUST pedir confirmação explícita. Exclusão acidental MUST ser evitável num toque.
- **FR-023**: Depois da confirmação, a remoção de presente ou foto MUST ser definitiva. O sistema MUST NOT oferecer restaurar, desfazer ou lista de ocultos. O casal MUST poder cadastrar um item novo com os mesmos dados se quiser.
- **FR-019**: O painel MUST falar português claro, mostrar estado vazio (“ainda não há presentes”), sucesso ao salvar, e erro recuperável, sem jargão técnico.
- **FR-020**: Se a persistência estiver indisponível, o painel MUST recusar o salvamento com mensagem honesta; o site público MUST continuar servindo a última versão boa dos conteúdos geridos. Falha de imagem ou de dados MUST NOT derrubar a página pública.
- **FR-021**: Logs e mensagens de erro MUST omitir senha, Pix completo e dados de convidados. Pix completo só aparece para o casal autenticado no formulário e para o convidado na experiência pública do presente aberto.

### Key Entities

- **Sessão dos noivos**: prova de que o visitante é o casal. Começa na entrada, termina ao sair ou 8 horas depois da entrada, e não é compartilhada com convidados.
- **Presente**: item da lista pública. Atributos: título, descrição, Pix, imagem, valor sugerido opcional, posição na lista. Remoção confirmada apaga o item de forma definitiva.
- **Foto do site**: arquivo de imagem associado a uma coleção (Capa, máximo 8, ou Nossa História, máximo 12) e a uma posição. Remoção confirmada apaga a foto de forma definitiva.
- **Bloco de texto**: trecho nomeado do site público. Campos únicos (mensagem da entrada, intro dos presentes, título, subtítulo, assinatura) ou lista de parágrafos (Grande Dia, Traje, corpo de Nossa História) que o casal inclui e apaga um a um.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um noivo que nunca viu o painel consegue autenticar e publicar o primeiro presente completo (título, descrição, Pix, imagem) em menos de 3 minutos, no celular.
- **SC-002**: Após um salvamento bem-sucedido, um convidado em janela anônima vê o conteúdo novo em no máximo 1 minuto, sem ninguém alterar código.
- **SC-003**: 100% das tentativas de abrir a gestão sem credenciais válidas terminam na tela de entrada, sem alteração de conteúdo. O mesmo vale para sessão com mais de 8 horas desde a entrada.
- **SC-004**: Em viewport de 360px, o casal completa criar presente, enviar uma foto da capa e editar um bloco de texto sem instrução extra de um desenvolvedor (tarefa concluída na primeira tentativa em teste com os dois noivos).
- **SC-005**: Remover um presente exige uma confirmação; cancelar a confirmação deixa o item público inalterado. Depois de confirmar, o item não reaparece no painel nem no site público.
- **SC-006**: Com a persistência indisponível, o casal recebe erro ao salvar e o site público permanece navegável com o conteúdo anterior, inclusive a lista de presentes já publicada.
- **SC-007**: Nenhum serviço com cobrança automática ou cartão obrigatório é adicionado para esta feature; o custo mensal incremental permanece zero no plano gratuito já adotado pelo projeto.

## Assumptions

- Um único login compartilhado do casal (mesmo identificador e senha para Neto e Mariah). Duas contas, recuperação por e-mail e “esqueci a senha” ficam fora desta versão; o mantenedor redefine a senha se precisarem.
- A área de gestão não é anunciada no menu, rodapé ou buscadores. O casal recebe o endereço pelo mantenedor (mensagem privada).
- Salvamento é publicação imediata. Não há rascunho, agendamento nem fluxo de aprovação entre os dois noivos.
- Conteúdo inicial do painel = o que o site já mostra hoje, inclusive presentes de exemplo. O casal edita ou apaga esses itens; não há um recorte automático que esconda exemplos no lançamento.
- Valor sugerido do presente permanece opcional, porque a experiência pública atual já o exibe quando existe; o casal pode deixar em branco.
- Fora desta versão: programação/timeline, dados do local (endereço, mapa, Instagram), listas de padrinhos/damas/honra, moderação de RSVP, mural de recados, fotos enviadas por convidados, e qualquer CMS externo.
- Textos que hoje estão só no código (entrada, Grande Dia, Traje) passam a ser blocos geridos; o que não estiver na lista de FR-011 continua como está.
- Parágrafos de Grande Dia, Traje e Nossa História são geridos um a um (adicionar/remover). Remover um parágrafo não usa lixeira: some ao salvar o bloco. Título, subtítulo, assinatura, mensagem da entrada e intro dos presentes são campos únicos.
- Justificativa de persistência (constituição II): os noivos são os autores e não operam o repositório. Planilha não cobre imagem nem UX no celular. O banco gratuito já ratificado na constituição é a persistência desta gestão; imagens reutilizam o armazenamento de mídia já previsto. RSVP e mural continuam sendo os outros usos de banco — esta feature acrescenta conteúdo de gestão do casal, não conteúdo de convidado.
- Estimativa de uso no pico (constituição I): na semana do casamento, dezenas de presentes, dezenas de fotos, dezenas de edições de texto. Estouro do plano gratuito resulta em bloqueio de escrita, nunca em cobrança. Limite de gasto do provedor permanece zero.
- Autenticação desta área é a autenticação dos noivos prevista na constituição IX, não login de convidado e não um produto de CMS.
- O painel herda a linguagem visual do site (casamento, português, leitura fácil), com ênfase em clareza e toques grandes no celular, não em densidade de ferramenta profissional.
