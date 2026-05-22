export interface DiscordCommandModule {
  name: string;
  modalId?: string;
  editModalId?: string; // Novo: Identificador do modal de edição
  renderModal?: () => any;
  handleSubmission?: (components: any[]) => any;
  handleEditSubmission?: (interaction: any) => any; // Novo: Tratamento da edição
  handleComponent?: (interaction: any) => any;
}
