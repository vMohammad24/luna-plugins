# [TidaLuna](https://github.com/Inrixia/TidaLuna) Plugins

This is a repository containing plugins I have made for the [TidaLuna Client](https://github.com/Inrixia/TidaLuna).  
Want to chat, ask questions or hang out? Join the discord! **[discord.gg/jK3uHrJGx4](https://discord.gg/jK3uHrJGx4)**  

If you like TidaLuna and my Plugins and want to support me you can do so on my [Sponsor Page](https://github.com/sponsors/Inrixia) ❤️

## Installing Plugins

1. Install the [TidaLuna Client](https://github.com/Inrixia/TidaLuna)
2. Open **Luna Settings**  
![image](https://github.com/user-attachments/assets/5fbfdda5-5272-45ef-bb4f-e12eef919358)  
3. Click on **Plugin Store**  
![image](https://github.com/user-attachments/assets/86145ddd-90d4-4cc8-9abd-2a94393faf55)
4. Install the plugins you want from the stores
   ![image](https://github.com/user-attachments/assets/f9824d1f-6fb7-4c2b-b6fc-e904d6a6ad1b)

## Contributing
Contributing is super simple and really appreciated!  
**If you want to make your own plugins please instead fork [luna-template](https://github.com/Inrixia/luna-template)**  

1. Ensure you have **node** and **pnpm** installed.  
   Install NVM (https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
   ```bash
   nvm install latest
   nvm use latest
   corepack enable
   ```

2. [Fork](https://github.com/Inrixia/luna-plugins/fork) the repo

2. Clone the repo
   ```bash
   git clone github.com/yournamehere/luna-plugins
   cd luna-plugins
   ```

3. Install the packages
   ```bash
   pnpm i
   ```

4. Start dev environment
   ```bash
   pnpm run watch
   ```

5. Work on DEV plugins  
   When running `pnpm run watch` a *DEV* store will appear in client allowing installing *DEV* versions of plugins.
   ![image](https://github.com/user-attachments/assets/c159bf00-6feb-41c8-8884-3d9e63070c19)
