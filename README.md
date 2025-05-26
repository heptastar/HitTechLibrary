# HitTechLibrary: An Open-sourced CMS for Library

## Install and Use
1. clone the project to local machine e.g. macbook or linux

2. login to cloudflare from local machine
~~~
npx wrangler login
~~~

3. create a cloudflare d1 database for storing tables of the project
~~~
npx wrangler d1 create libdb2
~~~

- you will obtain db info from cf as follows
~~~
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "libdb2",
      "database_id": "XXX-YOUR-ID-NUMBER-XXX"
    }
  ]
~~~
- append this json to the wrangler.jsonc located in root of the project, line 40 to 44
~~~
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "lib-cfd1pg-250523-js-njs-cfpg",
	"compatibility_date": "2025-05-23",
	"compatibility_flags": [
		"nodejs_compat"
	],
	"pages_build_output_dir": ".vercel/output/static",
	"observability": {
		"enabled": true
	},
	"d1_databases": [
		{
		  "binding": "DB",
		  "database_name": "libdb2",
		  "database_id": "XXX-YOUR-ID-NUMBER-XXX"
		}
	  ],
	"vars": { 
		"JWT_SECRET": "your-super-secret-key" 
	},
~~~

4. tables create and initialize, using the sql files under schemas folder under root
~~~
-- users table create in local and remote
npx wrangler d1 execute libdb2 --file schemas/users.sql
npx wrangler d1 execute libdb2 --remote --file schemas/users.sql

-- books table
npx wrangler d1 execute libdb2 --file schemas/book.sql
npx wrangler d1 execute libdb2 --remote --file schemas/book.sql

-- books search full-text index
npx wrangler d1 execute libdb2 --remote --file schemas/booksearch.sql
npx wrangler d1 execute libdb2 --file schemas/booksearch.sql

-- books search trigger for full text index
npx wrangler d1 execute libdb2 --remote --file schemas/booksetrigger.sql
npx wrangler d1 execute libdb2 --file schemas/booksetrigger.sql

-- lendings table for storing lending records
npx wrangler d1 execute libdb2 --remote --file schemas/lend.sql
npx wrangler d1 execute libdb2 --file schemas/lend.sql

-- optional: to insert mock data
npx wrangler d1 execute libdb2 --remote --file schemas/randbook.sql
npx wrangler d1 execute libdb2 --file schemas/randbook.sql
~~~

5. 









