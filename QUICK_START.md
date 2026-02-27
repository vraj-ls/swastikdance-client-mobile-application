# Quick Start - Optimized Code Usage

## Installation

Install the required dependency for PropTypes:

```bash
cd swastikdance-mobile-expo
npm install prop-types
```

## What Changed?

### 🆕 New Directories
- `/hooks` - Custom React hooks for reusable logic
- `/utils` - Utility functions for formatting and validation
- `/constants/config.js` - Application configuration constants

### ✨ Optimized Files
- `components/common/Button.jsx` - Added React.memo + PropTypes
- `components/common/TextInput.jsx` - Added PropTypes + onBlur support
- `components/layouts/BottomSheet.jsx` - Added React.memo + PropTypes
- `screens/AddStudentScreen.jsx` - Fully refactored with useForm hook
- `screens/DashboardScreen.jsx` - Optimized with useCallback/useMemo
- `screens/MainTabNavigator.jsx` - Removed Training, Performance, Hall Hire, Debug
- `screens/WebViewScreen.jsx` - Updated route titles

## Quick Examples

### 1. Using useForm Hook (Simplest Form Handling)

```javascript
import { useForm } from '../hooks';
import { validateEmail, validateRequired } from '../utils';

const MyForm = () => {
  // Define validation rules
  const validationRules = {
    email: validateEmail,
    password: (value) => validateRequired(value, 'Password'),
  };

  // Initialize form
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    { email: '', password: '' },  // Initial values
    handleLogin,                   // Submit handler
    validationRules                // Validation rules
  );

  async function handleLogin(formValues) {
    await authService.login(formValues.email, formValues.password);
  }

  return (
    <View>
      <TextInput
        label="Email"
        value={values.email}
        onChangeText={(text) => handleChange('email', text)}
        onBlur={() => handleBlur('email')}
        error={touched.email && errors.email}
      />
      <TextInput
        label="Password"
        value={values.password}
        onChangeText={(text) => handleChange('password', text)}
        onBlur={() => handleBlur('password')}
        error={touched.password && errors.password}
        secureTextEntry
      />
      <Button onPress={handleSubmit} loading={isSubmitting}>
        Login
      </Button>
    </View>
  );
};
```

### 2. Using Formatters (Clean Data Display)

```javascript
import { formatCurrency, formatDate, formatPhoneNumber } from '../utils';

const PaymentCard = ({ payment }) => {
  return (
    <View>
      <Text>{formatCurrency(payment.amountInCents)}</Text>
      <Text>{formatDate(payment.createdAt)}</Text>
      <Text>{formatPhoneNumber(payment.phone)}</Text>
    </View>
  );
};
```

### 3. Using Validators (Consistent Validation)

```javascript
import { validateEmail, validatePassword, composeValidators, validateRequired } from '../utils';

// Single validator
const emailError = validateEmail('test@example.com'); // null (valid)
const emailError2 = validateEmail('invalid'); // "Please enter a valid email address"

// Compose multiple validators
const emailValidator = composeValidators(
  (value) => validateRequired(value, 'Email'),
  validateEmail
);

const error = emailValidator(''); // "Email is required"
const error2 = emailValidator('invalid'); // "Please enter a valid email address"
const error3 = emailValidator('test@example.com'); // null (valid)
```

### 4. Using useCallback (Optimize Event Handlers)

```javascript
import { useCallback } from 'react';

const MyComponent = ({ navigation }) => {
  // Wrap event handlers with useCallback
  const handlePress = useCallback(() => {
    navigation.navigate('Details');
  }, [navigation]);

  const handleEdit = useCallback((id) => {
    navigation.navigate('Edit', { id });
  }, [navigation]);

  return (
    <View>
      <Button onPress={handlePress}>View</Button>
      <Button onPress={() => handleEdit('123')}>Edit</Button>
    </View>
  );
};
```

### 5. Using useMemo (Optimize Computed Values)

```javascript
import { useMemo } from 'react';

const StudentDetails = ({ student }) => {
  // Memoize computed values
  const fullName = useMemo(() => {
    return [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(' ');
  }, [student.firstName, student.middleName, student.lastName]);

  const age = useMemo(() => {
    const today = new Date();
    const birthDate = new Date(student.dob);
    return today.getFullYear() - birthDate.getFullYear();
  }, [student.dob]);

  return (
    <View>
      <Text>{fullName}</Text>
      <Text>{age} years old</Text>
    </View>
  );
};
```

### 6. Using Constants (No Magic Values)

```javascript
import { HTTP_STATUS, API_ENDPOINTS, VALIDATION } from '../constants/config';

// HTTP Status
if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
  // Handle 401
}

// API Endpoints
const response = await axios.get(API_ENDPOINTS.STUDENTS);

// Validation
if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
  Alert.alert('Error', `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`);
}
```

## Common Patterns

### Pattern 1: Form with Validation

```javascript
const validationRules = {
  email: validateEmail,
  password: (value) => validatePassword(value, { minLength: 8 }),
  confirmPassword: (value, allValues) =>
    validatePasswordConfirmation(allValues.password, value),
};

const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } =
  useForm(initialValues, handleSubmitForm, validationRules);
```

### Pattern 2: List with Optimized Rendering

```javascript
const renderItem = useCallback(({ item }) => (
  <StudentItem item={item} onPress={handlePress} />
), [handlePress]);

const keyExtractor = useCallback((item) => item.id, []);

<FlatList
  data={students}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
```

### Pattern 3: Event Handler with Dependencies

```javascript
const handleSubmit = useCallback(async () => {
  try {
    await saveStudent(studentData);
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}, [studentData, navigation]);
```

## Migrating Existing Code

### Before (Old Way)
```javascript
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  // Manual validation
  const newErrors = {};
  if (!firstName.trim()) {
    newErrors.firstName = 'First name is required';
  }
  if (!lastName.trim()) {
    newErrors.lastName = 'Last name is required';
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Manual submission
  setLoading(true);
  try {
    await api.post('/students', { firstName, lastName });
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### After (New Way)
```javascript
const validationRules = {
  firstName: (value) => validateRequired(value?.trim(), 'First name'),
  lastName: (value) => validateRequired(value?.trim(), 'Last name'),
};

const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
  useForm(
    { firstName: '', lastName: '' },
    handleAddStudent,
    validationRules
  );

async function handleAddStudent(formValues) {
  await api.post('/students', formValues);
  navigation.goBack();
}
```

**Benefits:**
- ✅ 70% less code
- ✅ Automatic validation
- ✅ Better error handling
- ✅ Consistent UX

## Testing

After making changes, test:

```bash
# Run the app
npm start

# Test on iOS
npm run ios

# Test on Android
npm run android
```

## Troubleshooting

### PropTypes Warning
If you see PropTypes warnings:
```bash
npm install prop-types
```

### Import Errors
If imports fail, check paths:
```javascript
// Correct
import { useForm } from '../hooks';
import { formatDate } from '../utils';

// Wrong
import { useForm } from './hooks';  // Missing ../
```

### React Hook Warnings
If you see "Rules of Hooks" errors:
- Hooks must be called at the top level
- Don't call hooks inside loops, conditions, or nested functions

## Performance Tips

1. **Use useCallback for event handlers**
   ```javascript
   const handlePress = useCallback(() => { ... }, [deps]);
   ```

2. **Use useMemo for expensive computations**
   ```javascript
   const result = useMemo(() => expensiveCalc(data), [data]);
   ```

3. **Memoize FlatList renders**
   ```javascript
   const renderItem = useCallback(({ item }) => <Item {...item} />, []);
   ```

4. **Use React.memo for pure components**
   ```javascript
   export const MyComponent = React.memo(({ data }) => { ... });
   ```

## Next Steps

1. ✅ Install prop-types
2. ✅ Test AddStudentScreen
3. ✅ Test DashboardScreen
4. 📝 Migrate other screens to use hooks
5. 📝 Add unit tests
6. 📝 Consider TypeScript

## Resources

- Full guide: `CODE_OPTIMIZATION_GUIDE.md`
- Summary: `OPTIMIZATION_SUMMARY.md`
- React Hooks: https://reactjs.org/docs/hooks-intro.html
- React.memo: https://reactjs.org/docs/react-api.html#reactmemo

---

**Happy Coding! 🚀**
