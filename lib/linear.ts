import { LinearClient } from "@linear/sdk";

const TEAM_KEY = "M";

export interface LinearTicket {
  id: string;
  title: string;
  description: string | undefined;
  labels: string[];
  team: string;
  url: string;
  completedAt: string;
}

export async function fetchCompletedTickets(since: string): Promise<LinearTicket[]> {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY is not set");

  const client = new LinearClient({ apiKey });

  const issues = await client.issues({
    filter: {
      team: { key: { eq: TEAM_KEY } },
      state: { name: { eq: "Done" } },
      completedAt: { gt: new Date(since) },
    },
    first: 100,
  });

  const tickets: LinearTicket[] = [];

  for (const issue of issues.nodes) {
    const labels = await issue.labels();
    const team = await issue.team;

    tickets.push({
      id: issue.identifier,
      title: issue.title,
      description: issue.description ?? undefined,
      labels: labels.nodes.map((l) => l.name),
      team: team?.name ?? "Unknown",
      url: issue.url,
      completedAt: issue.completedAt?.toISOString() ?? "",
    });
  }

  return tickets;
}

export function groupTicketsByLabel(
  tickets: LinearTicket[]
): Record<string, LinearTicket[]> {
  const groups: Record<string, LinearTicket[]> = {
    "AI Brain": [],
    Mila: [],
    Platform: [],
    Fixes: [],
  };

  for (const ticket of tickets) {
    const matchedLabel = ticket.labels.find((l) =>
      ["AI Brain", "Mila", "Platform"].includes(l)
    );

    if (matchedLabel) {
      groups[matchedLabel].push(ticket);
    } else if (ticket.labels.some((l) => l.toLowerCase().includes("bug") || l.toLowerCase().includes("fix"))) {
      groups["Fixes"].push(ticket);
    } else {
      groups["Platform"].push(ticket);
    }
  }

  return groups;
}
