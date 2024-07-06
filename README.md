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
