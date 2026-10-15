/**
 * In-memory Reversible Token Vault for session-based tokenization.
 * Upstream LLMs and logs never see original sensitive values.
 */
class TokenVault {
  private vault: Map<string, Map<string, string>> = new Map();

  /**
   * Stores a token-to-plaintext mapping for a given request
   */
  public store(requestId: string, token: string, original: string) {
    if (!this.vault.has(requestId)) {
      this.vault.set(requestId, new Map());
    }
    this.vault.get(requestId)!.set(token, original);
  }

  /**
   * Retrieves the plaintext for a given token in a request
   */
  public get(requestId: string, token: string): string | undefined {
    return this.vault.get(requestId)?.get(token);
  }

  /**
   * Retrieves all token mappings for a given request
   */
  public getAll(requestId: string): Record<string, string> {
    const map = this.vault.get(requestId);
    if (!map) return {};
    const res: Record<string, string> = {};
    for (const [k, v] of map.entries()) {
      res[k] = v;
    }
    return res;
  }

  /**
   * Purges token vault for request when session ends
   */
  public purge(requestId: string) {
    this.vault.delete(requestId);
  }
}

export const globalTokenVault = new TokenVault();
