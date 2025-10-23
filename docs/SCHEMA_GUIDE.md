# Internationalization (i18n) Schema Guide

The schema file (`i18n.schema.json`) is the heart of `i18n-llm`. It defines all the texts of your application in the source language, along with the context and constraints necessary to generate accurate, high-quality translations. A well-structured schema is fundamental to the success of the internationalization process.

This guide covers everything from basic concepts to advanced features of the schema, providing best practices to ensure your translations are efficient, consistent, and easy to manage.

## Basic Concepts

### Fundamental Structure

The schema is a JSON file consisting of key-value pairs. Each key represents a unique identifier for a specific text in your application, and the value corresponds to the text in the source language.

**Simple Example:**

```json
{
  "welcome_message": "Hello, world!",
  "user_greeting": "Welcome back, {userName}!"
}
```

In this example:
- `welcome_message` is a key for a static text.
- `user_greeting` is a key for a text that includes a variable `{userName}`.

### Nested Keys for Organization

To organize your texts logically, you can nest keys, grouping them by functionality, component, or page.

**Example with Nested Keys:**

```json
{
  "home_page": {
    "title": "Welcome to our Application",
    "subtitle": "The best solution for your needs."
  },
  "user_profile": {
    "title": "User Profile",
    "edit_button": "Edit Profile"
  }
}
```

This structure makes the schema more readable and easier to maintain as your application grows.



## Variables and Interpolation

Dynamic texts are common in any application. `i18n-llm` supports variable interpolation using the `{}` syntax.

**Example:**

```json
{
  "user_greeting": "Hello, {userName}!",
  "items_in_cart": "You have {itemCount} items in your cart."
}
```

When using the translated text in your application, you will replace `{userName}` and `{itemCount}` with the corresponding values. `i18n-llm` ensures that the variables are preserved in the generated translations.

### Best Practices for Variables

- **Descriptive Variable Names:** Use clear names like `{userName}` instead of `{p1}`. This helps translators (and the LLM) understand the context.
- **Avoid Constructing Sentences with Variables:** Do not concatenate translations to form sentences. Instead, create a complete sentence with variables. Many languages have different sentence structures, and concatenation can lead to grammatically incorrect translations.

  - **❌ Incorrect:** `"You have" + " " + itemCount + " " + "items"`
  - **✅ Correct:** `"You have {itemCount} items in your cart."`


## Pluralization

Pluralization is one of the most complex parts of internationalization, as different languages have different plural rules. `i18n-llm` simplifies this by using the ICU Message Format standard for pluralization.

To define pluralization rules, use a JSON object with the keys `one`, `other`, and optionally `zero`, `two`, `few`, `many`.

**Pluralization Example:**

```json
{
  "items_in_cart": {
    "one": "You have 1 item in your cart.",
    "other": "You have {itemCount} items in your cart."
  }
}
```

In this example:
- The `one` key is used when `itemCount` is 1.
- The `other` key is used for all other cases (in English).

### Advanced Plural Rules

Some languages, such as Polish or Russian, have more complex plural rules. `i18n-llm` supports all categories from the CLDR (Unicode Common Locale Data Repository) standard.

**Example with `few` and `many` (for Slavic languages):**

```json
{
  "files_count": {
    "one": "{count} plik",
    "few": "{count} pliki",
    "many": "{count} plików"
  }
}
```

`i18n-llm` will use the context of the target language to choose the correct plural form during translation.

### Best Practices for Pluralization

- **Always Provide `one` and `other`:** These are the minimum categories for most languages.
- **Use `{count}` as the Default Variable:** Standardize the count variable name to `{count}` to maintain consistency.
- **Test with Different Numbers:** Check if your pluralization rules work for 0, 1, 2, 5, 10, etc.



## Metadata for LLM Control

To obtain high-quality translations, it is essential to provide context to the Large Language Model (LLM). `i18n-llm` allows you to add metadata to any schema key using special keys prefixed with `$`.

This metadata is not part of the text to be translated but provides valuable instructions for the LLM.

### `$description`: Providing Context

The `$description` key is used to describe where and how the text is used in your application. This helps the LLM understand the context and generate a more appropriate translation.

**Example:**

```json
{
  "save_button": {
    "$description": "A button label for saving user settings. Keep it short and actionable.",
    "value": "Save"
  }
}
```

In this case, the description informs the LLM that "Save" is a button label, which will lead it to choose a concise and imperative translation, such as "Salvar" in Portuguese or "Guardar" in Spanish, instead of a longer translation.

### `$maxLen`: Restricting Translation Length

The `$maxLen` key defines a maximum character length for the translated text. This is extremely useful for user interface elements with limited space, such as buttons, titles, or notifications.

**Example:**

```json
{
  "new_feature_notification": {
    "$description": "A short notification title about a new feature.",
    "$maxLen": 20,
    "value": "New Feature Available!"
  }
}
```

`i18n-llm` will instruct the LLM to generate a translation that does not exceed 20 characters, preventing the text from breaking or overflowing in the interface.

### `$examples`: Providing Translation Examples

The `$examples` key allows you to provide one or more translation examples to guide the LLM's style, tone, and terminology. This is useful for ensuring consistency with other parts of your application or for following a specific style guide.

**Example:**

```json
{
  "delete_confirmation": {
    "$description": "A confirmation message before deleting an item.",
    "$examples": [
      {
        "pt-BR": "Confirmar exclusão?",
        "es-ES": "¿Confirmar eliminación?"
      }
    ],
    "value": "Confirm deletion?"
  }
}
```

By providing examples, you train the LLM to follow the desired pattern, resulting in more predictable and high-quality translations.


_continuation_of_previous_thought_

## Best Practices for a Robust Schema

1.  **Use Descriptive Keys:** `user_profile_save_button` is better than `btn_1`. This makes the schema self-documenting.

2.  **Organize with Nesting:** Group texts by feature or component to make navigation and maintenance easier.

3.  **Provide Context with `$description`:** Never underestimate the power of context. The more information you provide, the better the translation will be.

4.  **Use `$maxLen` for UI:** Avoid layout issues in the user interface by setting length constraints for texts in buttons, menus, and other elements with limited space.

5.  **Don't Split Sentences:** Keep complete sentences in a single key. Grammatical structure varies between languages, and concatenating text fragments almost always leads to errors.

6.  **Standardize Variables:** Use a consistent pattern for variable names, such as `{camelCase}`.

7.  **Leverage Pluralization:** Use the pluralization feature for all texts that depend on a count, instead of creating conditional logic in your code.

## Complete Schema Example

Below is an example of an `i18n.schema.json` file that combines all the concepts covered in this guide.

```json
{
  "global": {
    "app_title": {
      "$description": "The main title of the application, used in the browser tab.",
      "$maxLen": 30,
      "value": "My Awesome App"
    }
  },
  "user_dashboard": {
    "welcome_message": {
      "$description": "A personalized greeting for the user on their dashboard.",
      "value": "Welcome back, {userName}!"
    },
    "unread_notifications": {
      "$description": "A message indicating the number of unread notifications.",
      "one": "You have 1 unread notification.",
      "other": "You have {count} unread notifications."
    },
    "buttons": {
      "view_profile": {
        "$description": "A button that navigates to the user's profile page.",
        "$maxLen": 15,
        "value": "View Profile"
      },
      "logout": {
        "$description": "A button to log the user out.",
        "$examples": [
          {
            "de": "Abmelden",
            "fr": "Déconnexion"
          }
        ],
        "value": "Logout"
      }
    }
  }
}
```

