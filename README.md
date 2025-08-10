# Object Detection Demo

## Backend (Flask)

1. Open a terminal and navigate to the backend folder:

   ```bash
   cd backend
   ```

2. (Optional) Create a virtual environment:

   ```bash
   python -m venv venv

   # On Linux:
   source venv/bin/activate

   # On Windows:
   .\venv\Scripts\Activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Place your trained `.pt` model in the backend folder and update `app.py` to load it.

5. Start the Flask server:

   ```bash
   python app.py
   ```

   The server will run at http://localhost:5000

## Frontend

1. Open `frontend/index.html` in your web browser.
2. Upload an image and click "Detect Objects".
3. The results will be displayed below the image.

## Notes

- Make sure the backend is running before using the frontend.
