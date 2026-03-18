package model

type Category struct {
	ID             int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name           string    `gorm:"column:name;uniqueIndex;not null" json:"name"`
	Slug           string    `gorm:"column:slug;uniqueIndex;not null" json:"slug"`
	Description    *string   `gorm:"column:description" json:"description"`
	Icon           *string   `gorm:"column:icon" json:"icon"`
	SortOrder      int       `gorm:"column:sortOrder;default:0" json:"sortOrder"`
	SeoTitle       *string   `gorm:"column:seoTitle" json:"seoTitle"`
	SeoDescription *string   `gorm:"column:seoDescription" json:"seoDescription"`
	SeoKeywords    *string   `gorm:"column:seoKeywords" json:"seoKeywords"`
	CreatedAt      FlexTime  `gorm:"column:createdAt;autoCreateTime" json:"createdAt"`
	UpdatedAt      FlexTime  `gorm:"column:updatedAt;autoUpdateTime" json:"updatedAt"`
	Services       []Service `gorm:"foreignKey:CategoryID" json:"services,omitempty"`
}

func (Category) TableName() string { return "Category" }
