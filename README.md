# Conform Issue Reproduction

https://github.com/edmundhung/conform/discussions/243

## Setup

1. Clone the repo and run the following:

   ```
   npm install
   npm run setup
   npm run dev
   ```

1. Visit http://localhost:3000/repro or http://localhost:3000 and click the link.

1. Assuming `npm run setup` worked and the local SQLite database was seeded, there should already be
   a Contributing Factor entry in the database with the name "test". Fill out the name field of the
   "Add a new entry" form and submit. You should see an error message that an entry with that name
   already exists, but the invalid input (the name field) does not get auto-focused. Also, the only
   reason you see the correct error message is because of hack I through in to pull the error out of
   the form errors object rather than the "name" field config errors array.
