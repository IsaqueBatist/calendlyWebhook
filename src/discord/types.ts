// src/discord/types.ts
export interface DiscordCommandModule {
  name: string;
  // O custom_id base do modal. Ex: "form_escalar"
  modalId: string;
  // Função que retorna o JSON de resposta para abrir o Modal
  renderModal: () => any;
  // Função que recebe os campos do modal e retorna o JSON com a mensagem final
  handleSubmission: (components: any[]) => any;
}
