extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 4.5

var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _physics_process(delta):
	# Add gravity
	if not is_on_floor():
		velocity.y -= gravity * delta
	
	# Handle jump
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity
	
	# Get input direction
	var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	if direction:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		velocity.z = move_toward(velocity.z, 0, speed)
	
	move_and_slide()
	
	# Interaction with F key
	if Input.is_action_just_pressed("interact"):
		interact()

func interact():
	var space_state = get_world_3d().direct_space_state
	var camera = $Camera3D
	var from = camera.global_transform.origin
	var to = from - camera.global_transform.basis.z * 2.0 # Ray length 2 meters
	
	var query = PhysicsRayQueryParameters3D.create(from, to)
	query.exclude = [self]
	
	var result = space_state.intersect_ray(query)
	if result:
		var collider = result.collider
		print("Interacted with: ", collider.name)
		if collider.has_method("on_interact"):
			collider.on_interact()
