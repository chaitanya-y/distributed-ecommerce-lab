import { Client } from "@elastic/elasticsearch";

export const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
});

export async function connectElasticsearch() {
  if (!process.env.ELASTICSEARCH_URL) {
    throw new Error("ELASTICSEARCH_URL is missing");
  }

  const isAvailable = await elasticsearchClient.ping();

  if (!isAvailable) {
    throw new Error("Elasticsearch is not available");
  }

  console.log("Connected to Elasticsearch");
}
