package model

type Service struct {
	ID          int      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name        string   `gorm:"column:name;not null" json:"name"`
	URL         string   `gorm:"column:url;not null" json:"url"`
	Description string   `gorm:"column:description;not null" json:"description"`
	Icon        *string  `gorm:"column:icon" json:"icon"`
	ClickCount  int      `gorm:"column:clickCount;default:0;index" json:"clickCount"`
	CategoryID  int      `gorm:"column:categoryId;index" json:"categoryId"`
	SortOrder   int      `gorm:"column:sortOrder;default:0;index" json:"sortOrder"`
	CreatedAt   FlexTime `gorm:"column:createdAt;autoCreateTime" json:"createdAt"`
	UpdatedAt   FlexTime `gorm:"column:updatedAt;autoUpdateTime" json:"updatedAt"`
}

func (Service) TableName() string { return "Service" }

// ServiceWithCategory is used for API responses that include category info.
type ServiceWithCategory struct {
	Service
	CategoryName string `json:"categoryName"`
	CategorySlug string `json:"categorySlug,omitempty"`
}
