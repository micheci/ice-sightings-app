// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ["babel-preset-expo"],
//     plugins: [
//       "react-native-reanimated/plugin", // 👈 correct for Reanimated 2
//     ],
//   };
// };

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-worklets/plugin", // ⚠️ must be last
    ],
  };
};
