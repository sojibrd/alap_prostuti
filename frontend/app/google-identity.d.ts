// The slice of Google Identity Services (accounts.google.com/gsi/client) the app uses
type GoogleIdentity = {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
  }): void;
  renderButton(element: HTMLElement, options: Record<string, string | number>): void;
  disableAutoSelect(): void;
};

interface Window {
  google?: { accounts: { id: GoogleIdentity } };
}
