# Game of life inspired animation demo
This assigment consisted on using the TWEEN library to add animations to a scene.

The idea was to do a 3D version of the game of life in which "box"/cube/cell reproduction and death will show an animation.

The rules (totally invented and not related to the original game of life) are the following:
- Each cube has a lifetime initilized to 3
- At each tick the lifetime decreases
- Cubes can only reproduce when lifetime is equal to 2
	- Reproduction can happen in any of the cubes 26 neighbours
	- Each cube can reproduce up to 3 times
	- Each reproduction attempt has a 20% chance of failing
- When lifetime reaches 1 the cube turns red
- When lifetime reaches 0 the cube shows a death shrinking animation

Glitch code: https://glitch.com/edit/#!/ig-semana11-isac