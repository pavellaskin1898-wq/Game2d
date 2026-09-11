extends StaticBody3D

var is_open: bool = false
var open_position: Vector3
var closed_position: Vector3
@export var open_distance: float = 1.5

func _ready():
	closed_position = position
	# Determine open direction (to the right of the door's normal)
	open_position = position + transform.basis.x * open_distance

func on_interact():
	is_open = !is_open
	if is_open:
		# Animate door opening
		var tween = create_tween()
		tween.tween_property(self, "position", open_position, 0.5).set_ease(Tween.EASE_OUT)
	else:
		# Animate door closing
		var tween = create_tween()
		tween.tween_property(self, "position", closed_position, 0.5).set_ease(Tween.EASE_OUT)
