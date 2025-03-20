import autoprefixer from 'autoprefixer';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss'; // Updated import

export default {
  plugins: [
    postcssImport(),
    tailwindcss(), // This now uses the new package
    autoprefixer(),
  ],
}