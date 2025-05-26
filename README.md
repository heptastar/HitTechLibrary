# 📚 HitTechLibrary: An Open-sourced Book Management System based on Free-charged Cloudflare Pages and D1 Database, full-stacked with Nextjs and Tailwindcss

## 1. Features
- book create, retrieve, update and delete
- lending record's create, update, retieve
- common user login and registration
- admin user login and registration
- common user lending info (future)
  
## 2. Install and Use
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

5. start project in local machine
~~~
npm run preview
~~~

6. deploy to cloudflare
~~~
npm run deploy
~~~
- you will obtain following infor
~~~
✨ Compiled Worker successfully
✨ Uploading Worker bundle
✨ Uploading _routes.json
🌎 Deploying...
✨ Deployment complete! Take a peek over at https://YOUR-ASSIGNED-ID.lib-cfd1pg-250523-js-njs-cfpg.pages.dev
✨ Deployment alias URL: https://main.YOUR-ASSIGNED-DOMAINNAME.pages.dev
~~~

7. admin user setting
- click the previous assigned url to register admin account, for example, admin@qq.com, with password 122
- goto cloudflare.com to login with your Cloudflare account
- sidebar-> Storage & Databases-> D1 SQL Database-> libdb2-> Tables-> users-> ... -> update-> userrank NEEDS TO BE CHANGED TO 3
- user admin@qq.com with pwd 122 to login at URL: https://main.YOUR-ASSIGNED-DOMAINNAME.pages.dev
- BY HERE ALL IS DONE! ENJOY!











