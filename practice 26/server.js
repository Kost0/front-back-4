import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql

  type Author {
    id: ID!
    name: String!
    bio: String
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    genre: String!
    year: Int!
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
    author(id: ID!): Author
  }

  type Mutation {
    createAuthor(name: String!, bio: String): Author!
    createBook(title: String!, genre: String!, year: Int!, authorId: ID!): Book!
  }
`;

const authors = [
  { id: '1', name: 'Лев Толстой', bio: 'Великий русский писатель XIX века' },
  { id: '2', name: 'Фёдор Достоевский', bio: 'Классик русской литературы, мастер психологического романа' },
  { id: '3', name: 'Михаил Булгаков', bio: 'Русский писатель, драматург и театральный режиссёр' },
];

const books = [
  { id: '1', title: 'Война и мир', genre: 'Исторический роман', year: 1869, authorId: '1' },
  { id: '2', title: 'Анна Каренина', genre: 'Роман', year: 1877, authorId: '1' },
  { id: '3', title: 'Преступление и наказание', genre: 'Психологический роман', year: 1866, authorId: '2' },
  { id: '4', title: 'Идиот', genre: 'Роман', year: 1869, authorId: '2' },
  { id: '5', title: 'Мастер и Маргарита', genre: 'Мистический роман', year: 1967, authorId: '3' },
];

const resolvers = {
  Query: {
    books: () => books,

    book: (_, { id }) => books.find(b => b.id === id) ?? null,

    authors: () => authors,

    author: (_, { id }) => authors.find(a => a.id === id) ?? null,
  },

  Mutation: {
    createAuthor: (_, { name, bio }) => {
      const author = {
        id: String(authors.length + 1),
        name,
        bio: bio ?? null,
      };
      authors.push(author);
      console.log(`Создан автор: ${name} (id: ${author.id})`);
      return author;
    },

    createBook: (_, { title, genre, year, authorId }) => {
      const author = authors.find(a => a.id === authorId);
      if (!author) {
        throw new Error(`Автор с id=${authorId} не найден`);
      }
      const book = {
        id: String(books.length + 1),
        title,
        genre,
        year,
        authorId,
      };
      books.push(book);
      console.log(`Создана книга: "${title}" (id: ${book.id})`);
      return book;
    },
  },

  Book: {
    author: (parent) => authors.find(a => a.id === parent.authorId),
  },

  Author: {
    books: (parent) => books.filter(b => b.authorId === parent.id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`GraphQL Server готов: ${url}`);
console.log(`Apollo Sandbox доступен по адресу: ${url}\n`);