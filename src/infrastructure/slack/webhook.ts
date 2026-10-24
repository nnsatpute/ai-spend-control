/** Posts one line to a Slack incoming webhook. Failures are logged, not thrown. */
export async function postSlack(webhookUrl: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("[slack] webhook status", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[slack] webhook failed", error);
    return false;
  }
}