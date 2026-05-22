export interface DiscordCommandModule {
  name: string;
  modalId?: string;
  renderModal?: () => any;
  handleSubmission?: (components: any[]) => any;
  handleComponent?: (interaction: any) => any;
}
