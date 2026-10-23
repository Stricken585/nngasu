import { locales, type LocaleTranslations } from 'adminjs';

// В AdminJS нет русской локали. Берём английскую как основу (на случай
// непереведённых ключей) и переопределяем то, что видно в интерфейсе.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const en = locales.en as unknown as Record<string, Record<string, any>>;

const properties = {
  id: 'ID',
  email: 'Email',
  fullName: 'ФИО',
  role: 'Роль',
  group: 'Группа',
  createdAt: 'Создано',
  newPassword: 'Новый пароль',
  name: 'Название',
  teacher: 'Преподаватель',
  discipline: 'Дисциплина',
  student: 'Студент',
  dayOfWeek: 'День недели',
  weekParity: 'Неделя',
  pairNumber: 'Пара',
  room: 'Аудитория',
  lessonType: 'Тип занятия',
  value: 'Оценка',
  content: 'Текст',
  title: 'Заголовок',
  sender: 'Отправитель',
  receiver: 'Получатель',
};

const enumValues = {
  'role.STUDENT': 'Студент',
  'role.TEACHER': 'Преподаватель',
  'role.ADMIN': 'Администратор',
  'dayOfWeek.MONDAY': 'Понедельник',
  'dayOfWeek.TUESDAY': 'Вторник',
  'dayOfWeek.WEDNESDAY': 'Среда',
  'dayOfWeek.THURSDAY': 'Четверг',
  'dayOfWeek.FRIDAY': 'Пятница',
  'dayOfWeek.SATURDAY': 'Суббота',
  'weekParity.EVEN': 'Чётная',
  'weekParity.ODD': 'Нечётная',
  'lessonType.LECTURE': 'Лекция',
  'lessonType.PRACTICE': 'Практика',
  'lessonType.LAB': 'Лабораторная',
};

const resourceNames = ['User', 'Group', 'Discipline', 'Assignment', 'ScheduleEntry', 'Grade', 'Message', 'News'];

export const ruTranslations: LocaleTranslations = {
  ...en,
  actions: {
    new: 'Создать',
    edit: 'Редактировать',
    show: 'Просмотр',
    delete: 'Удалить',
    bulkDelete: 'Удалить выбранные',
    list: 'Список',
  },
  buttons: {
    ...en.buttons,
    save: 'Сохранить',
    addNewItem: 'Добавить',
    filter: 'Фильтр',
    filterActive: 'Фильтр ({{count}})',
    applyChanges: 'Применить',
    resetFilter: 'Сбросить',
    confirmRemovalMany: 'Подтвердите удаление записей: {{count}}',
    confirmRemovalMany_plural: 'Подтвердите удаление записей: {{count}}',
    logout: 'Выйти',
    login: 'Войти',
    createFirstRecord: 'Создать первую запись',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
  },
  components: {
    ...en.components,
    Login: {
      welcomeHeader: 'Администрирование',
      welcomeMessage: 'Управление группами, дисциплинами, расписанием и пользователями сайта вуза',
      properties: { email: 'Email', password: 'Пароль' },
      loginButton: 'Войти',
    },
  },
  labels: {
    ...en.labels,
    navigation: 'Навигация',
    pages: 'Страницы',
    selectedRecords: 'Выбрано ({{selected}})',
    filters: 'Фильтры',
    dashboard: 'Главная',
    User: 'Пользователи',
    Group: 'Группы',
    Discipline: 'Дисциплины',
    Assignment: 'Закрепления (кто что ведёт)',
    ScheduleEntry: 'Расписание',
    Grade: 'Оценки',
    Message: 'Сообщения',
    News: 'Новости',
  },
  properties: { ...en.properties, ...properties, length: 'Длина', from: 'С', to: 'По' },
  resources: Object.fromEntries(
    resourceNames.map((name) => [name, { properties: { ...properties, ...enumValues } }]),
  ),
  messages: {
    ...en.messages,
    successfullyBulkDeleted: 'Удалено записей: {{count}}',
    successfullyBulkDeleted_plural: 'Удалено записей: {{count}}',
    successfullyDeleted: 'Запись удалена',
    successfullyUpdated: 'Запись обновлена',
    successfullyCreated: 'Запись создана',
    thereWereValidationErrors: 'Есть ошибки в форме — проверьте поля ниже',
    forbiddenError: 'Действие «{{actionName}}» недоступно для {{resourceId}}',
    anyForbiddenError: 'Это действие недоступно',
    noRecordsSelected: 'Не выбрано ни одной записи',
    theseRecordsWillBeRemoved: 'Будет удалена запись',
    theseRecordsWillBeRemoved_plural: 'Будут удалены записи',
    pickSomeFirstToRemove: 'Сначала выберите записи для удаления',
    noRecordsInResource: 'Записей пока нет',
    noRecords: 'Нет записей',
    confirmDelete: 'Удалить эту запись?',
    invalidCredentials: 'Неверный email или пароль (или нет прав администратора)',
    welcomeOnBoard_title: 'Администрирование сайта вуза',
    welcomeOnBoard_subtitle:
      'Порядок настройки: группы и дисциплины → пользователи (роль, группа) → закрепления → расписание',
  },
};
