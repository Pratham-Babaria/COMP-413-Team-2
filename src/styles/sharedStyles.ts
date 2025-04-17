/**
 * File for shared styles between React components using tailwind.
 */

export const styles = {
    // Layout + spacing
    sectionPadding: "m-4 px-4 py-6",
    panelClass: "p-4 rounded-lg shadow",
    contentAreaClass: "flex-grow bg-gray-200 rounded-lg",
    fullPageClass: "flex flex-col h-screen bg-[#e5f2fb]",
  
    // Navbar
    navBarClass: `flex justify-between items-center bg-blue-500 text-white m-4 px-4 py-6`,
    navButtonClass: "flex items-center gap-2 px-4 py-2 bg-blue-400 rounded-full hover:bg-blue-600 transition text-white",
  
    // Cards
    surveyCardClass: "flex justify-between items-center bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition",
  
    // Buttons
    loginBtn: "w-full py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold rounded-full hover:from-blue-500 hover:to-blue-600 transition",
    takeSurveyBtn: "bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition",
    deleteSurveyBtn: "bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition",
    createSurveyBtn: "bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition",
  
    // Typography
    cardHeaderClass: "text-2xl text-blue-600 font-bold mb-4",
    emptyStateText: "text-lg text-gray-700 mb-4",

    // Eye tracking dot
    gazeDot: "fixed w-3 h-3 bg-red-500 rounded-full pointer-events-none z-[9999]",
};
  
