<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Validation Helper
 * Validates incoming HTTP payloads, formats, sanitization, and constraints.
 */

class Validator {
    private array $data;
    private array $errors = [];

    public function __construct(array $data) {
        $this->data = $data;
    }

    public static function make(array $data): self {
        return new self($data);
    }

    public function required(string ...$fields): self {
        foreach ($fields as $field) {
            if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
                $this->errors[$field][] = "The {$field} field is required.";
            }
        }
        return $this;
    }

    public function email(string $field): self {
        if (!empty($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "The {$field} must be a valid email address.";
        }
        return $this;
    }

    public function phone(string $field): self {
        if (!empty($this->data[$field])) {
            $cleaned = preg_replace('/[^0-9]/', '', (string)$this->data[$field]);
            // Support Indian 10-digit mobile numbers, optionally prefixed with 91 or 0
            if (!preg_match('/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/', (string)$this->data[$field])) {
                $this->errors[$field][] = "The {$field} must be a valid 10-digit mobile number.";
            }
        }
        return $this;
    }

    public function minLength(string $field, int $min): self {
        if (!empty($this->data[$field]) && mb_strlen((string)$this->data[$field]) < $min) {
            $this->errors[$field][] = "The {$field} must be at least {$min} characters.";
        }
        return $this;
    }

    public function in(string $field, array $allowed): self {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed, true)) {
            $this->errors[$field][] = "The selected {$field} is invalid. Allowed: " . implode(', ', $allowed);
        }
        return $this;
    }

    public function numeric(string $field): self {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field][] = "The {$field} must be a number.";
        }
        return $this;
    }

    public function coordinates(string $latField = 'latitude', string $lngField = 'longitude'): self {
        if (!empty($this->data[$latField])) {
            $lat = (float)$this->data[$latField];
            if ($lat < -90.0 || $lat > 90.0) {
                $this->errors[$latField][] = "Latitude must be between -90 and 90.";
            }
        }
        if (!empty($this->data[$lngField])) {
            $lng = (float)$this->data[$lngField];
            if ($lng < -180.0 || $lng > 180.0) {
                $this->errors[$lngField][] = "Longitude must be between -180 and 180.";
            }
        }
        return $this;
    }

    public function fails(): bool {
        return !empty($this->errors);
    }

    public function passes(): bool {
        return empty($this->errors);
    }

    public function errors(): array {
        return $this->errors;
    }

    public function firstError(): string {
        foreach ($this->errors as $fieldErrors) {
            if (!empty($fieldErrors)) {
                return $fieldErrors[0];
            }
        }
        return 'Validation error occurred.';
    }
}
