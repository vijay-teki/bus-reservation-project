package com.busbooking.bus_reservation.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping; // <-- IMPORT THIS
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.busbooking.bus_reservation.model.Bus;
import com.busbooking.bus_reservation.service.BusService;

@RestController
@RequestMapping("/api/buses")
@CrossOrigin(origins = "*") // This is generally okay for development, but for production, you might want to be more specific.
public class BusController {

    @Autowired
    private BusService busService;

    @PostMapping("/add")
    public ResponseEntity<Bus> addBus(@RequestBody Bus bus) {
        return ResponseEntity.ok(busService.addBus(bus));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Bus>> getAllBuses() {
        return ResponseEntity.ok(busService.getAllBuses());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Bus>> searchBuses(
            @RequestParam String source,
            @RequestParam String destination) {
        return ResponseEntity.ok(busService.searchBuses(source, destination));
    }

    // --- FIX: ADD THIS ENTIRE METHOD ---
    @PutMapping("/update/{id}")
    public ResponseEntity<Bus> updateBus(@PathVariable String id, @RequestBody Bus busDetails) {
        try {
            Bus updatedBus = busService.updateBus(id, busDetails);
            return ResponseEntity.ok(updatedBus);
        } catch (Exception e) {
            // This could be a more specific exception like ResourceNotFoundException
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteBus(@PathVariable String id) {
        try {
            String message = busService.deleteBus(id);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
}

