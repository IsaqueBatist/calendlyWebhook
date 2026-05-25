export interface DiscordCommandModule {
  name: string;
  modalId?: string;
  editModalId?: string;
  buttonPrefixes?: string[]; // NOVO: Define quais botões pertencem a este módulo
  renderModal?: () => any;
  handleSubmission?: (components: any[], interaction?: any) => any;
  handleEditSubmission?: (interaction: any) => any;
  handleComponent?: (interaction: any) => any;
}
