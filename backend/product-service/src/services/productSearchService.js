import { elasticsearchClient } from "../config/elasticsearch.js";

const PRODUCT_INDEX = "products";

export async function indexProduct(product) {
  await elasticsearchClient.index({
    index: PRODUCT_INDEX,
    id: product._id.toString(),
    document: {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
    },
  });
}


// export async function searchProducts(query) {
//   const result = await elasticsearchClient.search({
//     index: PRODUCT_INDEX,
//     query: {
//       multi_match: {
//         query,
//         fields: ["name", "description", "category"],
//       },
//     },
//   });

//   return result.hits.hits.map((hit) => hit._source);
// }


export async function searchProducts(query) {
  const result = await elasticsearchClient.search({
    index: PRODUCT_INDEX,
    query: {
      bool: {
        should: [
          {
            multi_match: {
              query,
              fields: ["name^3", "description", "category^2"],
              fuzziness: "AUTO",
            },
          },
          {
            match_phrase_prefix: {
              name: {
                query,
                boost: 3,
              },
            },
          },
          {
            match_phrase_prefix: {
              category: {
                query,
                boost: 2,
              },
            },
          },
          {
            wildcard: {
              name: {
                value: `*${query}*`,
                case_insensitive: true,
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
  });

  return result.hits.hits.map((hit) => hit._source);
}