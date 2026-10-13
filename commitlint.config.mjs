// Convención de commits del equipo: `tipo: descripción breve en presente`.
// Ver la página Desarrollo → Commits de la documentación. La revisa el hook `commit-msg` (husky) y CI en cada PR.
// Commits que ya estaban en el repositorio antes de adoptar la convención. No agregues nuevos.
const legacyCommits = [
  'Initial commit',
  'ADD sse agregaron las vistas',
  'ADD se corrigieron errrores',
  'MODIFY: se modificaron archivos',
];

export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => legacyCommits.some((prefix) => message.startsWith(prefix))],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'style', 'revert'],
    ],
    // Las descripciones van en español: no se fuerza mayúscula/minúscula ni largo del cuerpo.
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
