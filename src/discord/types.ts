export interface DiscordCommandModule {
  name: string;
  modalId?: string;
  editModalId?: string;
  crossoverModalId?: string;
  buttonPrefixes?: string[];

  renderModal?: () => any;
  handleSubmission?: (components: any, interaction?: any) => any | Promise<any>;
  handleEditSubmission?: (interaction: any) => any | Promise<any>;
  handleCrossoverSubmission?: (
    components: any,
    interaction: any,
  ) => any | Promise<any>;
  handleComponent?: (interaction: any) => any | Promise<any>;
}
