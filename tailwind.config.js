/** this function takes in a css color variable name as well as extract a tailwind opacity class that may be present to combined the two
  link below helps explain this
  * https://www.youtube.com/watch?v=MAtaT8BZEAo&t=891s **/
  function withOpacity(variableName) {
    return ({ opacityValue }) => {
        if (opacityValue != undefined) {
            return `rgba(var(${variableName}), ${opacityValue})`;
        }
        return `rgb(var(${variableName})`;
    };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")]
}