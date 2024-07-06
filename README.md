### Setting Up the Project

1. **Download the Project:**
   - Click the green "Code" button on the project's GitHub page.
   - Select "Download ZIP" and save the file to your computer.
   - Unzip the downloaded file.

2. **Create the `.env` File:**
   - Inside the unzipped project folder, find a file named `.env.example`.
   - Make a copy of this file and rename the copy to `.env`.

3. **Add Your OpenAI API Key:**
   - Open the `.env` file you just created using a text editor (like Notepad).
   - You will see a line that says `OPENAI_API_KEY=""`.
   - Enter your OpenAI API key between the quotation marks so it looks like this: `OPENAI_API_KEY="your-api-key-here"`.
   - Save and close the file.

4. **Update the API Key in `routes/index.js`:**
   - Open the `routes/index.js` file in a text editor.
   - Find the line where the API key is set (look for something like `const apiKey = ""`).
   - Enter your OpenAI API key between the quotation marks so it looks like this: `const apiKey = "your-api-key-here"`.
   - Save and close the file.

5. **Install Dependencies:**
   - Open a terminal or command prompt.
   - Navigate to the unzipped project folder.
   - Run the following command to install the necessary files:
     ```bash
     npm install
     ```

6. **Run the Project:**
   - After the installation is complete, run the following command to start the project:
     ```bash
     node server.js
     ```

### Note:
This application's code was entirely created using ChatGPT without writing a single line of code as a fun project. Thus, it might have limitations, but it surprisingly does the main job well, which is generating vectors from text prompts.

**Core Features:**
- Multi-Image Generation: Generate multiple images simultaneously, considering API limits per minute.
- Size Selection: Specify the desired size for the output.
- Prompt Styling: Create unique prompts to guide the model's output style.
- Quality Settings: Adjust the quality of generated images.
- Auto-Save Mode: Choose between automatic saving for images and SVGs or saving individual outputs as needed.

### Problems/Limitations:
  - AI-generated code structure may have limitations.
  - Dependent on API limits for concurrent image generation.
  - Output quality can vary based on prompt clarity.
  - AI-generated code may lack optimization found in manually coded apps.
  - API constraints limit the number of images generated per minute.
  - Output quality influenced by prompt specificity.
