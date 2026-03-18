package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

type FlexTime struct {
	time.Time
}

func (t *FlexTime) Scan(value any) error {
	switch v := value.(type) {
	case nil:
		t.Time = time.Time{}
		return nil
	case time.Time:
		t.Time = v
		return nil
	case int64:
		t.Time = unixToTime(v)
		return nil
	case float64:
		t.Time = unixToTime(int64(v))
		return nil
	case []byte:
		return t.parseString(string(v))
	case string:
		return t.parseString(v)
	default:
		return fmt.Errorf("unsupported time value %T", value)
	}
}

func (t FlexTime) Value() (driver.Value, error) {
	if t.Time.IsZero() {
		return nil, nil
	}
	return t.Time, nil
}

func (t FlexTime) MarshalJSON() ([]byte, error) {
	if t.Time.IsZero() {
		return json.Marshal("")
	}
	return json.Marshal(t.Time.Format(time.RFC3339))
}

func (t *FlexTime) UnmarshalJSON(data []byte) error {
	var raw string
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	return t.parseString(raw)
}

func (t *FlexTime) parseString(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		t.Time = time.Time{}
		return nil
	}

	if number, err := strconv.ParseInt(raw, 10, 64); err == nil {
		t.Time = unixToTime(number)
		return nil
	}

	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999-07:00",
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, raw); err == nil {
			t.Time = parsed
			return nil
		}
	}

	return fmt.Errorf("unsupported time string %q", raw)
}

func unixToTime(value int64) time.Time {
	switch {
	case value > 1_000_000_000_000:
		return time.UnixMilli(value).UTC()
	case value > 1_000_000_000:
		return time.Unix(value, 0).UTC()
	default:
		return time.Unix(value, 0).UTC()
	}
}
