# Prisma Database Helper Documentation
This is a guide on certain workflows that you may need when managing the Prisma Database and ORM.
## Creating your first Prisma migration
1. Create `schema.prisma` file inside the `prisma` directory.
2. Add a database provider.
    ```
    generator client {
        provider = "prisma-client-js"
    }
    ```
3. Inside `schema.prisma`, specify your Database server. Here's a sample using PostgreSQL.
    ```
    datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
    }
    ```
4. Create your models and other database rules.
5. Create the migration by following running the commands below. Follow the prompts given by Prisma when needed.
    ```
    npx prisma generate
    npx prisma migrate dev
    ```
6. Optional: Add dummy data to the database.
    ```
    npm run db:seed
    ```
## Transitioning from your current Database server into a new Database server
1. Rename or delete the `migrations` directory inside the `prisma` directory.
2. Inside `schema.prisma` change your datasource into the new database you want. Here's an example for SQLite.
    ```
    datasource db {
        provider = "sqlite"
        url = "file:./main.db"
    }
    ```
3. Create the migration again using the commands below. Follow the prompts when given.
    ```
    npx prisma generate
    npx prisma migrate dev
    ```
4. Check that everything still works.
    ```
    npm run dev
    ```