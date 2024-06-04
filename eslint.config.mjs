import pluginJs from '@eslint/js'
import pluginJest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      jest: pluginJest,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
    },
  },
]
