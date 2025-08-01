package com.busbooking.bus_reservation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

@GetMapping("/health-check")
   public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
