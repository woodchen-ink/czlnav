package model

type Setting struct {
	ID        int      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Key       string   `gorm:"column:key;uniqueIndex;not null" json:"key"`
	Value     string   `gorm:"column:value;not null" json:"value"`
	CreatedAt FlexTime `gorm:"column:createdAt;autoCreateTime" json:"createdAt"`
	UpdatedAt FlexTime `gorm:"column:updatedAt;autoUpdateTime" json:"updatedAt"`
}

func (Setting) TableName() string { return "Setting" }
