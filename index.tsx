<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>litelelo.</title> <!-- Changed title as well -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Keep Inter for the main body text -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- ADDED: Raleway font with Black 900 weight for the logo -->
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@900&display=swap" rel="stylesheet">
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            // ADDED: New font family for the logo
            raleway: ['Raleway', 'sans-serif'], 
          },
          colors: {
            'brand-green': '#3cfba2',
            'brand-green-darker': '#2fae85',
            'dark-primary': '#020617',
            'dark-secondary': '#0f172a',
            'dark-tertiary': '#1e293b',
          }
        }
      }
    }
  </script>
<script type="importmap">
{
  "imports": {
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
    "react/": "https://aistudiocdn.com/react@^19.1.1/",
    "react": "https://aistudiocdn.com/react@^19.1.1",
    "react-router-dom": "https://aistudiocdn.com/react-router-dom@^7.9.2",
    "@supabase/supabase-js": "https://aistudiocdn.com/@supabase/supabase-js@^2.57.4"
  }
}
</script>
<link rel="stylesheet" href="/index.css">
</head>
  <body class="bg-dark-primary text-gray-200 font-sans">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>