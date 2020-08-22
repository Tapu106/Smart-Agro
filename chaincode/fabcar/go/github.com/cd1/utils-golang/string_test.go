package utils

import (
	"testing"
	"unicode/utf8"
)

func TestRandomString(t *testing.T) {
	str := RandomString()
	if l := utf8.RuneCountInString(str); l != StringLength {
		t.Errorf("random string has invalid length; string = %v, length = %v", str, l)
	}
}

func BenchmarkRandomString(b *testing.B) {
	for n := 0; n < b.N; n++ {
		_ = RandomString()
	}
}
