/*
  CNC_machine class stores the position of the tool head as well as other
  specification's

  It can simulate a given gcode command i.e. GOO, GO1, GO2, GO3

  note: gcode arcs should be equal or less than 45 deg for best results
        otherwise bugs might arrise
*/
class CNC_machine{
  constructor(_pitch = 1, _step_angle = 1.8){
    this.pos = new Point(0, 0, 0);

    this.pitch = _pitch; //Pitch of lead screws driven by steppers (mm)
    this.step_angle = _step_angle; //Step angle of steppers (deg)

    var _ds = this.pitch * this.step_angle / 360;
    this.step_distance = new Point(_ds, _ds, _ds); //All step distances are the same

    this.error = 0.0035; //Used for rounding errors

    this.stepBuffer = "";
    this.frameRate = 100;
  }

  goto(pos){
    this.pos = pos.assign()
    console.log(this.pos);
  }

  G0(gcode_object){
    var mode = gcode_object.g == '00'?'rapid':'feed'
    var steps = "";
    var last_distance = this.pos.distance(gcode_object.coord);
    var next_distance = last_distance - this.error;

    var float_p = this.pos.assign();
    var future_p  = this.pos.assign();

    var last_steps = 0;
    var CW = gcode_object.g == '02';
    try{
      var center = this.pos.getCenter(gcode_object.coord, gcode_object.r, CW);
    } catch(err){
      throw err
    }

    var m = this.pos.gradient(gcode_object.coord).xy;

    if(this.pos.z != gcode_object.coord.z){
      var steps = Math.round(Math.abs(gcode_object.coord.z - this.pos.z)/this.step_distance.z)
      if(this.pos.z > gcode_object.coord.z){
        this.pos.z = gcode_object.coord.z
        return {steps: 'd'.repeat(steps), mode: 'Z'+mode}
      }else{
        this.pos.z = gcode_object.coord.z
        return {steps: 'z'.repeat(steps), mode: 'Z'+mode}
      }
    }

    for(var i = 0; next_distance < last_distance; i++){
      last_steps = 0;
      this.pos.setToPoint(future_p);

      var dir_cor_x = 0;
      var dir_cor_y = 0;
      if(parseInt(gcode_object.g) > 1){
        float_p = float_p.moveCircular(center, gcode_object.r, this.step_distance, CW)
        dir_cor_x = (CW ? 1:-1)*float_p.quad(center, this.step_distance).y;
        dir_cor_y = (CW ? -1:1)*float_p.quad(center, this.step_distance).x;
      }else{
        float_p = float_p.moveLinear(gcode_object.coord, m, this.step_distance)
        dir_cor_x = this.pos.direction(gcode_object.coord, 'x');
        dir_cor_y = this.pos.direction(gcode_object.coord, 'y');
      }

      //If the float position is within an error term of a step_distance divsions

      if(Math.abs(float_p.x - this.pos.x - dir_cor_x*this.step_distance.x) < this.error){
        if(this.pos.direction(float_p, 'x') > 0){
          future_p.x += this.step_distance.x;
          steps += 'x';
        }else{
          future_p.x -= this.step_distance.x;
          steps += 's';
        }
        last_steps += 1;
      }
      if(Math.abs(float_p.y - this.pos.y - dir_cor_y*this.step_distance.y) < this.error){
        if(this.pos.direction(float_p, 'y') > 0){
          future_p.y += this.step_distance.y;
          steps += 'y';
        }else{
          future_p.y -= this.step_distance.y;
          steps += 'h';
        }
        last_steps += 1;
      }
      next_distance = future_p.distance(gcode_object.coord);
      last_distance = this.pos.distance(gcode_object.coord);
      if(!(next_distance < last_distance)){
      }
    }
    steps = steps.substring(0, steps.length - last_steps);
    this.stepBuffer += steps;
    return {steps: steps, mode: mode}
  }
}

console.log(12%8);
//Point class has x, y, z variables and can perform functions with other points
class Point{

  constructor(_x = 0, _y = 0, _z = 0){
    this.x = _x;
    this.y = _y;
    this.z = _z;
  }
  direction(p1, dim){
    if(p1[dim] == this[dim]) return 1
    return (p1[dim] - this[dim])/Math.abs(p1[dim] - this[dim])
  }

  /*
    Returns the quadrant of this point after potentially moving a distance
    (step_distance) in respects to a circle with the given center
    Params:
      this          - the Point whos quadrant is to be returned
      center        - a Point corresponding to the center of the circle
      step_distance - a Point representing a vector of distances

    Returns:
      quadrant      - a Point representing which quadrant each dimension is in (+ve or -ve)
  */
  quad(center, step_distance){
    var quadrant = new Point()
    for(var dim in quadrant){
      var dif = this[dim] - center[dim]
      if(dif > 0){
        if(dif - step_distance[dim] > 0){
          quadrant[dim] = 1
        }else{
          quadrant[dim] = -1
        }
      }else{
        if(dif + step_distance[dim] < 0){
          quadrant[dim] = -1
        }else{
          quadrant[dim] = 1
        }
      }
    }
    return quadrant
  }

  moveLinear(p2, m, step_distance){
    m = Math.abs(m)
    var moved_point = this.assign()
    if(m > 0){
      if(m > 1){
        moved_point.y += this.direction(p2, 'y') * step_distance.y;
        moved_point.x += this.direction(p2, 'x') * step_distance.y / m;
      }else{
        moved_point.x += this.direction(p2, 'x') * step_distance.x;
        moved_point.y += this.direction(p2, 'y') * step_distance.x * m;
      }
    }else if(m == 0){
      moved_point.x += this.direction(p2, 'x') * step_distance.x;
    }
    return moved_point
  }

  moveCircular(center, r, step_distance, CW = true){
    var m = -1 / center.gradient(this).xy
    var moved_point = this.assign()
    if(Math.abs(m) < 1){
      moved_point.x += (CW?1:-1) * this.quad(center, step_distance).y * step_distance.x;
      moved_point.y = center.y + this.quad(center, step_distance).y*Math.sqrt(r*r - (moved_point.x - center.x)*(moved_point.x - center.x))
    }else{
      moved_point.y += (CW?-1:1) * this.quad(center, step_distance).x * step_distance.y
      moved_point.x = center.x + this.quad(center, step_distance).x*Math.sqrt(r*r - (moved_point.y - center.y)*(moved_point.y - center.y))
    }
    return moved_point
  }


  //Returns the center of a circle that intersects this Point
  //and another point: p2
  //and has a radius : r
  //given the arc goes in a clockwise direction or counterclockwise
  //CW = false
  getCenter(p2, r, CW = true){
    if (r == 0) return 0
    if (this.direction(p2, 'y') >= 0) CW = !CW
    var pbc = this.midpoint(p2);          //Midpoint of the chord
    var b = this.distance(pbc);           //Distance from point to midpoint

    var h = Math.sqrt(r*r - b*b);          //The distance from the midpoint to the center of circle
    var m = -1 / this.gradient(p2).xy;    //The gradient of the line going from the midpoint to the center is
                                          // perpendicular to the chord m1 * m2 = -1 (for m1 |_ m2)
    var h_vector = new Point(h*cos_tan(m), h*sin_tan(m), this.z);
    var center = CW ? pbc.sub(h_vector) : pbc.add(h_vector);
    return center
  }

  setToPoint(p){
    this.x = p.x;
    this.y = p.y;
    this.z = p.z;
  }

  setCoords(_x = 0, _y = 0, _z = 0){
    this.x = _x;
    this.y = _y;
    this.z = _z;
  }

  add(p){
    var x = this.x + p.x;
    var y = this.y + p.y;
    var z = this.z + p.z;
    return new Point(x, y, z)
  }

  sub(p){
    var x = this.x - p.x;
    var y = this.y - p.y;
    var z = this.z - p.z;
    return new Point(x, y, z)
  }

  div(p){
    var x = this.x / p.x;
    var y = this.y / p.y;
    var z = this.z / p.z;
    return new Point(x, y, z)
  }

  mult(p){
    var x = this.x * p.x;
    var y = this.y * p.y;
    var z = this.z * p.z;
    return new Point(x, y, z)
  }

  midpoint(p){
    var x = (this.x + p.x)/2;
    var y = (this.y + p.y)/2;
    var z = (this.z + p.z)/2;
    return new Point(x, y, z)
  }

  gradient(p){
    var m_xy = (p.y - this.y)/(p.x - this.x);
    var m_xz = (p.z - this.z)/(p.x - this.x);
    var m_yz = (p.z - this.z)/(p.y - this.y);
    return {xy: m_xy, xz: m_xz, yz: m_yz}
  }

  assign(){
    return new Point(this.x, this.y, this.z)
  }

  distance(p){
    return Math.sqrt((p.x - this.x)*(p.x - this.x) + (p.y - this.y)*(p.y - this.y));
  }
}

let cos_tan = (m) => {
  return Math.sqrt(1 / (1 + m*m))
}
let sin_tan = (m) =>{
  return m*cos_tan(m)
}

console.log('CNC_machine package used');
