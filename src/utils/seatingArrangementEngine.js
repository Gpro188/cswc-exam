/**
 * Generates an automated exam seating arrangement for multiple classes and halls.
 * 
 * Rules configurable:
 * 1. separateSameClassAdjacent (default: true): No two students from the same class sit immediately side-by-side (immediate adjacent seats) on the same bench.
 *    (Note: If Seat 2 is Class B, Seat 3 is Class A, Seat 4 is Class B, Seat 2 and Seat 4 are NOT side-by-side because Seat 3 separates them!)
 * 2. disallowSameClassBench (default: false): Strictly forbid more than one student of the same class anywhere on the same bench.
 * 3. alternateRows (default: false): Alternates starting class per row.
 * 
 * @param {Array} halls - List of halls [{ id, name, totalBenches, studentsPerBench, columns, rows }]
 * @param {Array} classes - List of classes [{ id, name, students: [{ id, rollNo, name }] }]
 * @param {Object} rulesConfig - User-selected rules
 * @returns {Object} { allocations: Array, unassignedStudents: Array }
 */
export function generateSeatingArrangement(
  halls = [], 
  classes = [], 
  rulesConfig = {
    separateSameClassAdjacent: true, // Only prevent directly adjacent seats on same bench
    disallowSameClassBench: false,   // Forbid same class on same bench entirely
    fillEmptySeatsIfLeftover: true    // If only one class left, allow placement rather than leaving empty
  }
) {
  // 1. Prepare student queues per class
  const classQueues = classes.map(c => ({
    classId: c.id,
    className: c.name,
    students: (c.students || []).map(s => ({
      ...s,
      classId: c.id,
      className: c.name
    }))
  })).filter(c => c.students.length > 0);

  // Deep clone student queues so we don't mutate input
  const studentQueues = classQueues.map(cq => ({
    classId: cq.classId,
    className: cq.className,
    queue: [...cq.students]
  }));

  const hallAllocations = [];
  const unassignedStudents = [];

  for (const hall of halls) {
    const totalBenches = Math.max(1, hall.totalBenches || 1);
    const capacityPerBench = Math.max(1, hall.studentsPerBench || 2);
    const columns = Math.max(1, hall.columns || 4);
    
    const benches = [];

    for (let bIndex = 0; bIndex < totalBenches; bIndex++) {
      const benchNumber = bIndex + 1;
      const rowNum = Math.floor(bIndex / columns) + 1;
      const colNum = (bIndex % columns) + 1;

      const seats = [];
      const assignedClassIdsOnThisBench = new Set();

      for (let sIdx = 0; sIdx < capacityPerBench; sIdx++) {
        const seatPositionName = capacityPerBench === 1 
          ? 'Single' 
          : capacityPerBench === 2 
            ? (sIdx === 0 ? 'Left' : 'Right')
            : `Seat ${sIdx + 1}`;

        // Check who sat in the immediately preceding seat on this bench
        const prevSeat = sIdx > 0 ? seats[sIdx - 1] : null;
        const prevClassId = prevSeat?.student?.classId;

        // Filter candidate classes based on enabled rules
        const eligibleClasses = studentQueues.filter(cq => {
          if (cq.queue.length === 0) return false;

          // Rule 1: No side-by-side immediate neighbors from same class
          if (rulesConfig.separateSameClassAdjacent && prevClassId && cq.classId === prevClassId) {
            return false;
          }

          // Rule 2: Strictly no duplicate class anywhere on the same bench (optional)
          if (rulesConfig.disallowSameClassBench && assignedClassIdsOnThisBench.has(cq.classId)) {
            return false;
          }

          return true;
        }).sort((a, b) => b.queue.length - a.queue.length);

        if (eligibleClasses.length > 0) {
          const chosenClass = eligibleClasses[0];
          const student = chosenClass.queue.shift();
          assignedClassIdsOnThisBench.add(chosenClass.classId);

          seats.push({
            seatIndex: sIdx,
            seatPositionName,
            student: {
              id: student.id,
              rollNo: student.rollNo,
              name: student.name,
              classId: chosenClass.classId,
              className: chosenClass.className
            }
          });
        } else {
          // If strict rule blocked candidates, check fallback
          const remainingWithStudents = studentQueues.filter(cq => cq.queue.length > 0);
          
          if (rulesConfig.fillEmptySeatsIfLeftover && remainingWithStudents.length > 0 && !rulesConfig.disallowSameClassBench) {
            // Even if same class, if user allows filling leftover students:
            const chosenClass = remainingWithStudents.sort((a, b) => b.queue.length - a.queue.length)[0];
            const student = chosenClass.queue.shift();
            assignedClassIdsOnThisBench.add(chosenClass.classId);

            seats.push({
              seatIndex: sIdx,
              seatPositionName,
              student: {
                id: student.id,
                rollNo: student.rollNo,
                name: student.name,
                classId: chosenClass.classId,
                className: chosenClass.className
              }
            });
          } else {
            // Leave seat empty
            seats.push({
              seatIndex: sIdx,
              seatPositionName,
              student: null
            });
          }
        }
      }

      benches.push({
        benchId: `${hall.id}_b_${benchNumber}`,
        benchNumber,
        rowNum,
        colNum,
        seats
      });
    }

    hallAllocations.push({
      hallId: hall.id,
      hallName: hall.name,
      totalBenches,
      studentsPerBench: capacityPerBench,
      columns,
      benches
    });
  }

  // Any students still remaining in queues couldn't be placed
  studentQueues.forEach(cq => {
    cq.queue.forEach(s => {
      unassignedStudents.push({
        id: s.id,
        rollNo: s.rollNo,
        name: s.name,
        classId: cq.classId,
        className: cq.className
      });
    });
  });

  return {
    hallAllocations,
    unassignedStudents
  };
}

/**
 * Validates whether two students on the same bench have a rule conflict.
 * ONLY flags a violation if:
 * 1. adjacentOnly is true: They sit in IMMEDIATELY ADJACENT seats (e.g. Seat 2 & Seat 3) with no student/seat in between.
 * 2. If adjacentOnly is false: Flag duplicate classes anywhere on the bench.
 */
export function checkBenchRuleViolations(benches = [], options = { adjacentOnly: true, disallowSameClassBench: false }) {
  const violations = [];

  benches.forEach(bench => {
    if (!options.adjacentOnly && options.disallowSameClassBench) {
      // Entire bench duplicate check
      const classCounts = {};
      bench.seats.forEach(seat => {
        if (seat.student?.classId) {
          classCounts[seat.student.classId] = (classCounts[seat.student.classId] || 0) + 1;
        }
      });

      Object.entries(classCounts).forEach(([classId, count]) => {
        if (count > 1) {
          violations.push({
            benchNumber: bench.benchNumber,
            benchId: bench.benchId,
            classId,
            reason: `More than one student from the same class on Bench #${bench.benchNumber}`
          });
        }
      });
      return;
    }

    // Default & True Anti-cheating rule:
    // Only flag if two students of the SAME CLASS are sitting IMMEDIATELY NEXT TO EACH OTHER
    // (i.e. directly adjacent occupied seats with no different class student in between)
    const occupiedSeats = [];
    bench.seats.forEach((seat, idx) => {
      if (seat.student) {
        occupiedSeats.push({ ...seat, seatIndex: idx });
      }
    });

    for (let i = 0; i < occupiedSeats.length - 1; i++) {
      const current = occupiedSeats[i];
      const next = occupiedSeats[i + 1];

      // If they are directly adjacent (seatIndex difference is 1) and from the exact same class
      if (next.seatIndex === current.seatIndex + 1 && current.student.classId === next.student.classId) {
        violations.push({
          benchNumber: bench.benchNumber,
          benchId: bench.benchId,
          classId: current.student.classId,
          seatA: current.seatPositionName,
          seatB: next.seatPositionName,
          reason: `Immediate neighbors (${current.seatPositionName} & ${next.seatPositionName}) are from the same class (${current.student.className})`
        });
      }
    }
  });

  return violations;
}
